import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { graves, inventoryItems, users, type User } from '$lib/server/db/schema';
import { GRAVE_INSCRIPTION_MAX, RESURRECTION_WINDOW_SECONDS } from '$lib/constants/game';
import { MAX_REVIVALS, REVIVAL_PRICES_RUB } from '$lib/constants/pricing';
import { RESURRECTION_CROSS } from '$lib/constants/drop';
import { logEvent } from './journal';

export interface DeathInfo {
	/** В пределах окна (24ч после гибели) — можно действовать. */
	windowOpen: boolean;
	/** unixtime окончания окна. */
	windowEndsAt: number;
	/** Сколько платных воскрешений уже использовано. */
	revivalsUsed: number;
	/** Цена следующего платного воскрешения (null — лимит исчерпан). */
	nextPrice: number | null;
	/** Есть ли «Крест воскрешения» (бесплатное воскрешение). */
	hasCross: boolean;
	/** Текущая надпись на надгробии. */
	inscription: string | null;
}

/** Последняя могила пользователя (текущей смерти). */
function latestGrave(userId: number) {
	return db
		.select()
		.from(graves)
		.where(eq(graves.userId, userId))
		.orderBy(desc(graves.createdAt))
		.limit(1)
		.then((rows) => rows[0]);
}

export async function getDeathInfo(user: User): Promise<DeathInfo | null> {
	if (user.diedAt === null) return null;

	const now = Math.floor(Date.now() / 1000);
	const windowEndsAt = user.diedAt + RESURRECTION_WINDOW_SECONDS;

	const grave = await latestGrave(user.id);
	const [cross] = await db
		.select({ id: inventoryItems.id })
		.from(inventoryItems)
		.where(and(eq(inventoryItems.userId, user.id), eq(inventoryItems.itemKey, RESURRECTION_CROSS)))
		.limit(1);

	return {
		windowOpen: now < windowEndsAt,
		windowEndsAt,
		revivalsUsed: user.revivals,
		nextPrice: user.revivals < MAX_REVIVALS ? REVIVAL_PRICES_RUB[user.revivals] : null,
		hasCross: Boolean(cross),
		inscription: grave?.inscription ?? null
	};
}

/** Можно ли сейчас действовать после смерти (мертв и окно открыто). */
function withinWindow(user: User): boolean {
	if (user.diedAt === null) return false;
	return Math.floor(Date.now() / 1000) < user.diedAt + RESURRECTION_WINDOW_SECONDS;
}

/** Оставить/обновить надпись на своём надгробии (в пределах окна). */
export async function inscribeGrave(user: User, text: string): Promise<boolean> {
	if (!withinWindow(user)) return false;
	const grave = await latestGrave(user.id);
	if (!grave) return false;

	const clean = text.trim().slice(0, GRAVE_INSCRIPTION_MAX);
	await db.update(graves).set({ inscription: clean }).where(eq(graves.id, grave.id));
	await logEvent(user.id, 'death', `🪦 Надпись на надгробии: «${clean}»`);
	return true;
}

/** Общая часть воскрешения: оживить персонажа и убрать его могилу. */
async function revive(userId: number, countAsPaid: boolean): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	await db
		.update(users)
		.set({
			diedAt: null,
			biteMovesLeft: null,
			activeAt: now,
			...(countAsPaid ? { revivals: sql`${users.revivals} + 1` } : {})
		})
		.where(eq(users.id, userId));

	const grave = await latestGrave(userId);
	if (grave) await db.delete(graves).where(eq(graves.id, grave.id));
}

export type ReviveResult =
	| { ok: true; notice: string }
	| { ok: false; reason: 'window_closed' | 'no_cross' | 'limit_reached' };

/** Бесплатное воскрешение «Крестом воскрешения» (не тратит платные попытки). */
export async function resurrectWithCross(user: User): Promise<ReviveResult> {
	if (!withinWindow(user)) return { ok: false, reason: 'window_closed' };

	const [cross] = await db
		.select({ id: inventoryItems.id })
		.from(inventoryItems)
		.where(and(eq(inventoryItems.userId, user.id), eq(inventoryItems.itemKey, RESURRECTION_CROSS)))
		.limit(1);
	if (!cross) return { ok: false, reason: 'no_cross' };

	await db.delete(inventoryItems).where(eq(inventoryItems.id, cross.id));
	await revive(user.id, false);

	const notice = '✝️ Воскрешение Крестом — ты снова в игре';
	await logEvent(user.id, 'revival', notice);
	return { ok: true, notice };
}

/**
 * Платное воскрешение (200/300/500 ₽, до 3 раз).
 * Вызывать ТОЛЬКО после подтверждённой оплаты — деньги списывает платёжный провайдер.
 */
export async function resurrectPaid(user: User): Promise<ReviveResult> {
	if (!withinWindow(user)) return { ok: false, reason: 'window_closed' };
	if (user.revivals >= MAX_REVIVALS) return { ok: false, reason: 'limit_reached' };

	await revive(user.id, true);

	const notice = '💸 Платное воскрешение — ты снова в игре';
	await logEvent(user.id, 'revival', notice);
	return { ok: true, notice };
}

/**
 * Воскрешение после подтверждённой оплаты (Platega callback).
 * Окно не проверяем — оплата = право на воскрешение. Применяется, только если мёртв.
 */
export async function revivePaidByPayment(userId: number): Promise<void> {
	const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	if (!u || u.diedAt === null) return;
	await revive(userId, true);
	await logEvent(userId, 'revival', '💸 Платное воскрешение — ты снова в игре');
}
