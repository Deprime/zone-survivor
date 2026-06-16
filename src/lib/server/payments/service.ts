import { and, eq } from 'drizzle-orm';
import { PUBLIC_SITE_URL } from '$env/static/public';
import { db } from '$lib/server/db';
import { payments, users, type Payment, type User } from '$lib/server/db/schema';
import { RESURRECTION_WINDOW_SECONDS } from '$lib/constants/game';
import {
	MAX_INVENTORY_SIZE,
	MAX_REVIVALS,
	REVIVAL_PRICES_RUB,
	getInventoryExpandPrice
} from '$lib/constants/pricing';
import { revivePaidByPayment } from '$lib/server/game/resurrection';
import { createPayment } from './platega';

export type Purpose = 'revival' | 'inventory';

export type Quote =
	| { eligible: true; amount: number; label: string }
	| { eligible: false; reason: string };

/** Что и за сколько покупает игрок (с проверкой права). */
export function quotePurchase(user: User, purpose: Purpose): Quote {
	if (purpose === 'revival') {
		if (user.diedAt === null) return { eligible: false, reason: 'Персонаж жив.' };
		const now = Math.floor(Date.now() / 1000);
		if (now >= user.diedAt + RESURRECTION_WINDOW_SECONDS) {
			return { eligible: false, reason: 'Окно воскрешения истекло.' };
		}
		if (user.revivals >= MAX_REVIVALS) {
			return { eligible: false, reason: 'Лимит воскрешений исчерпан.' };
		}
		return {
			eligible: true,
			amount: REVIVAL_PRICES_RUB[user.revivals],
			label: 'Воскрешение персонажа'
		};
	}

	// inventory
	const amount = getInventoryExpandPrice(user.inventorySize);
	if (amount == null) return { eligible: false, reason: 'Инвентарь уже максимального размера.' };
	return {
		eligible: true,
		amount,
		label: `Расширение инвентаря (${user.inventorySize} → ${user.inventorySize + 1})`
	};
}

const siteBase = () => (PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

/** Создаёт платёж и возвращает ссылку Platega для оплаты. */
export async function startPayment(
	user: User,
	purpose: Purpose
): Promise<{ redirect: string } | { error: string }> {
	const quote = quotePurchase(user, purpose);
	if (!quote.eligible) return { error: quote.reason };

	const [{ id }] = await db
		.insert(payments)
		.values({ userId: user.id, purpose, amountRub: quote.amount, status: 'pending' })
		.$returningId();

	const returnUrl = `${siteBase()}/app/pay/return?id=${id}`;
	const created = await createPayment({
		amount: quote.amount,
		description: quote.label,
		returnUrl,
		failedUrl: returnUrl,
		payload: String(id)
	});

	await db.update(payments).set({ providerTxId: created.transactionId }).where(eq(payments.id, id));

	return { redirect: created.redirect };
}

export function getPaymentForUser(id: number, userId: number): Promise<Payment | undefined> {
	return db
		.select()
		.from(payments)
		.where(and(eq(payments.id, id), eq(payments.userId, userId)))
		.limit(1)
		.then((rows) => rows[0]);
}

export interface PlategaCallback {
	id: string;
	amount: number;
	currency: string;
	status: string;
	paymentMethod: number;
	payload?: string;
}

/** Выдаёт купленное (вызывается один раз при переходе в confirmed). */
async function applyEntitlement(payment: Payment): Promise<void> {
	if (payment.purpose === 'revival') {
		await revivePaidByPayment(payment.userId);
	} else if (payment.purpose === 'inventory') {
		const [u] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
		if (u && u.inventorySize < MAX_INVENTORY_SIZE) {
			await db
				.update(users)
				.set({ inventorySize: u.inventorySize + 1 })
				.where(eq(users.id, payment.userId));
		}
	}
}

/** Обрабатывает callback Platega: меняет статус и идемпотентно выдаёт покупку. */
export async function handleCallback(body: PlategaCallback): Promise<void> {
	let payment = await db
		.select()
		.from(payments)
		.where(eq(payments.providerTxId, body.id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!payment && body.payload && /^\d+$/.test(body.payload)) {
		payment = await db
			.select()
			.from(payments)
			.where(eq(payments.id, Number(body.payload)))
			.limit(1)
			.then((rows) => rows[0]);
	}
	if (!payment) return;

	if (body.status === 'CONFIRMED') {
		// Сверка суммы.
		if (Math.round(body.amount) !== payment.amountRub) {
			console.error(
				`[pay] сумма не совпала: ${body.amount} ≠ ${payment.amountRub} (id ${payment.id})`
			);
			return;
		}
		// Идемпотентный переход pending → confirmed.
		const raw = await db
			.update(payments)
			.set({ status: 'confirmed' })
			.where(and(eq(payments.id, payment.id), eq(payments.status, 'pending')));
		const header = (Array.isArray(raw) ? raw[0] : raw) as { affectedRows?: number };
		if ((header?.affectedRows ?? 0) === 1) {
			await applyEntitlement(payment);
		}
	} else if (body.status === 'CANCELED') {
		await db
			.update(payments)
			.set({ status: 'canceled' })
			.where(and(eq(payments.id, payment.id), eq(payments.status, 'pending')));
	} else if (body.status === 'CHARGEBACKED') {
		await db.update(payments).set({ status: 'chargebacked' }).where(eq(payments.id, payment.id));
	}
}
