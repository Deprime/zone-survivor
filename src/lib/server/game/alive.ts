import { and, eq, gt, isNull, lte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { graves, users, type User } from '$lib/server/db/schema';
import { redis } from '$lib/server/redis';
import {
	COOLDOWN_SECONDS,
	DEATH_WARNING_BEFORE_SECONDS,
	LIFESPAN_SECONDS,
	TOKENS_PER_PRESS
} from '$lib/constants/game';
import { countInventory, randomStep, resolveCellEvent, type CellEvent } from './world';
import { resolveThreat, type ThreatEvent } from './zombie';
import { getActiveSeason } from './season';
import { logEvent, logEvents } from './journal';
import { enqueueNotification } from '$lib/server/notifications/queue';
import { cellEventMessage, threatMessage } from '$lib/game-messages';

export type AliveStatus = 'ready' | 'cooldown' | 'dead';

export interface AliveState {
	status: AliveStatus;
	/** unixtime (сек): когда кнопка снова станет активной. */
	nextActiveAt: number;
	/** unixtime (сек): когда персонаж погибнет без нажатия. */
	diesAt: number;
}

const cooldownKey = (userId: number) => `cooldown:${userId}`;
const aliveKey = (userId: number) => `alive:${userId}`;

/** Состояние кнопки выводится из active_at и текущего времени. */
export function computeAliveState(user: Pick<User, 'activeAt' | 'diedAt'>): AliveState {
	const now = Math.floor(Date.now() / 1000);
	const nextActiveAt = user.activeAt + COOLDOWN_SECONDS;
	const diesAt = user.activeAt + LIFESPAN_SECONDS;

	let status: AliveStatus;
	if (user.diedAt !== null || now >= diesAt) status = 'dead';
	else if (now < nextActiveAt) status = 'cooldown';
	else status = 'ready';

	return { status, nextActiveAt, diesAt };
}

/**
 * Фиксирует гибель персонажа (идемпотентно) и ставит надгробие на его клетке.
 * @returns true, если смерть зафиксирована именно этим вызовом.
 */
export async function killUser(
	user: Pick<User, 'id' | 'posX' | 'posY' | 'tokens' | 'chatId'>,
	diedAt: number,
	options: { log?: boolean } = {}
): Promise<boolean> {
	const raw = await db
		.update(users)
		.set({ diedAt })
		.where(and(eq(users.id, user.id), isNull(users.diedAt)));

	const header = (Array.isArray(raw) ? raw[0] : raw) as { affectedRows?: number };
	if ((header?.affectedRows ?? 0) !== 1) return false;

	// Надгробие с токенами павшего на клетке гибели.
	await db.insert(graves).values({
		userId: user.id,
		x: user.posX,
		y: user.posY,
		tokens: user.tokens,
		looted: false
	});

	// Журнал: для заражения смерть логирует pressAlive (log: false), иначе — таймаут.
	if (options.log !== false) {
		await logEvent(user.id, 'death', '☠️ Персонаж погиб — не нажал «Я жив» вовремя');
	}

	try {
		await redis.del(aliveKey(user.id), cooldownKey(user.id));
	} catch {
		/* Redis-кэш некритичен */
	}

	// Личное уведомление о гибели.
	await enqueueNotification({ type: 'death', chatId: user.chatId });
	return true;
}

export type PressResult =
	| {
			ok: true;
			x: number;
			y: number;
			tokens: number;
			event: CellEvent;
			threat: ThreatEvent;
			notices: string[];
	  }
	| { ok: false; reason: 'dead' | 'cooldown' | 'expired' };

/**
 * Нажатие «Я жив»: атомарный guard'ом UPDATE (тик активности + токен),
 * затем ход в случайную клетку и разрешение события на ней.
 */
export async function pressAlive(userId: number): Promise<PressResult> {
	const now = Math.floor(Date.now() / 1000);

	const raw = await db
		.update(users)
		.set({ activeAt: now, tokens: sql`${users.tokens} + ${TOKENS_PER_PRESS}` })
		.where(
			and(
				eq(users.id, userId),
				isNull(users.diedAt),
				lte(users.activeAt, now - COOLDOWN_SECONDS), // кулдаун (12ч) прошёл
				gt(users.activeAt, now - LIFESPAN_SECONDS) // ещё не умер (24ч)
			)
		);

	const header = (Array.isArray(raw) ? raw[0] : raw) as { affectedRows?: number };
	if ((header?.affectedRows ?? 0) !== 1) {
		const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (!u || u.diedAt !== null) return { ok: false, reason: 'dead' };
		if (now - u.activeAt >= LIFESPAN_SECONDS) {
			await killUser(u, u.activeAt + LIFESPAN_SECONDS);
			return { ok: false, reason: 'expired' };
		}
		return { ok: false, reason: 'cooldown' };
	}

	// Нажатие засчитано — двигаемся и разрешаем событие клетки.
	const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	if (!u) return { ok: false, reason: 'dead' };

	const next = randomStep(u.posX, u.posY);
	const itemCount = await countInventory(userId);
	const { event, tokenDelta } = await resolveCellEvent({
		userId,
		x: next.x,
		y: next.y,
		itemCount,
		inventorySize: u.inventorySize
	});

	// Угроза хода: прогресс заражения или встреча зомби (может списать антидот/патрон,
	// найденные в т.ч. на этой клетке).
	const season = await getActiveSeason();
	const threatOutcome = await resolveThreat(u, season.startsAt);

	const finalTokens = u.tokens + tokenDelta;
	const update: Partial<typeof users.$inferInsert> = {
		posX: next.x,
		posY: next.y,
		tokens: finalTokens
	};
	if (threatOutcome.setBiteMovesLeft !== undefined) {
		update.biteMovesLeft = threatOutcome.setBiteMovesLeft;
	}
	if (threatOutcome.setZombieWeek !== undefined) {
		update.zombieWeek = threatOutcome.setZombieWeek;
	}
	await db.update(users).set(update).where(eq(users.id, userId));

	// Журнал/тосты: формируем человекочитаемые сообщения по итогам хода.
	const notices: string[] = [
		`Отметка «Я жив»: +${TOKENS_PER_PRESS} 🪙`,
		`Ход на клетку (${next.x}, ${next.y})`
	];
	const cellMsg = cellEventMessage(event);
	if (cellMsg) notices.push(cellMsg);
	const thrMsg = threatMessage(threatOutcome.threat);
	if (thrMsg) notices.push(thrMsg);
	await logEvents(
		userId,
		notices.map((m) => ({ type: 'game', message: m }))
	);

	// Смерть от заражения — фиксируем на новой клетке (death уже в журнале как угроза).
	if (threatOutcome.death) {
		await killUser(
			{ id: userId, posX: next.x, posY: next.y, tokens: finalTokens, chatId: u.chatId },
			Math.floor(Date.now() / 1000),
			{ log: false }
		);
	} else {
		// Уведомление об укусе + отложенные напоминания (с проверкой актуальности в воркере).
		if (threatOutcome.threat.type === 'zombie_bite') {
			await enqueueNotification({
				type: 'bite',
				chatId: u.chatId,
				movesLeft: threatOutcome.threat.movesLeft
			});
		}
		await enqueueNotification(
			{ type: 'active_reminder', userId, activeAt: now },
			{ delay: COOLDOWN_SECONDS * 1000 }
		);
		await enqueueNotification(
			{ type: 'death_warning', userId, activeAt: now },
			{ delay: (LIFESPAN_SECONDS - DEATH_WARNING_BEFORE_SECONDS) * 1000 }
		);
	}

	try {
		await redis
			.multi()
			.set(cooldownKey(userId), '1', 'EX', COOLDOWN_SECONDS)
			.set(aliveKey(userId), '1', 'EX', LIFESPAN_SECONDS)
			.exec();
	} catch {
		/* Redis-кэш некритичен */
	}

	return {
		ok: true,
		x: next.x,
		y: next.y,
		tokens: finalTokens,
		event,
		threat: threatOutcome.threat,
		notices
	};
}
