import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { inventoryItems, users, type User } from '$lib/server/db/schema';
import { DROP, type DropItemId } from '$lib/constants/drop';
import { MERCHANT_OPEN_ISO_DAYS } from '$lib/constants/game';
import { consumeOneItem, countInventory } from './world';
import { logEvent } from './journal';
import { ITEM_LABEL } from '$lib/game-messages';

const label = (id: string) => ITEM_LABEL[id] ?? id;

/** Что можно купить и продать у торговца. */
export const BUYABLE: DropItemId[] = ['ammo', 'antidote'];
export const SELLABLE: DropItemId[] = ['loot'];

/** Лавка открыта в конце недели (сб–вс). */
export function isMerchantOpen(d = new Date()): boolean {
	const isoDow = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
	return MERCHANT_OPEN_ISO_DAYS.includes(isoDow);
}

export interface MerchantState {
	open: boolean;
	tokens: number;
	inventorySize: number;
	itemCount: number;
	buy: { id: DropItemId; key: string; price: number }[];
	sell: { id: DropItemId; key: string; price: number; count: number }[];
}

export async function getMerchantState(user: User): Promise<MerchantState> {
	const items = await db
		.select({ itemKey: inventoryItems.itemKey })
		.from(inventoryItems)
		.where(eq(inventoryItems.userId, user.id));

	const counts: Record<string, number> = {};
	for (const it of items) counts[it.itemKey] = (counts[it.itemKey] ?? 0) + 1;

	return {
		open: isMerchantOpen(),
		tokens: user.tokens,
		inventorySize: user.inventorySize,
		itemCount: items.length,
		buy: BUYABLE.map((id) => ({ id, key: DROP[id].key, price: DROP[id].cost })),
		sell: SELLABLE.map((id) => ({
			id,
			key: DROP[id].key,
			price: DROP[id].cost,
			count: counts[id] ?? 0
		}))
	};
}

export type TradeResult =
	| { ok: true; notice: string }
	| {
			ok: false;
			reason:
				| 'closed'
				| 'dead'
				| 'not_buyable'
				| 'not_sellable'
				| 'no_tokens'
				| 'no_space'
				| 'no_item';
	  };

/** Купить предмет за токены. */
export async function buyItem(user: User, itemId: string): Promise<TradeResult> {
	if (user.diedAt !== null) return { ok: false, reason: 'dead' };
	if (!isMerchantOpen()) return { ok: false, reason: 'closed' };
	if (!BUYABLE.includes(itemId as DropItemId)) return { ok: false, reason: 'not_buyable' };

	const id = itemId as DropItemId;
	const price = DROP[id].cost;

	if ((await countInventory(user.id)) >= user.inventorySize)
		return { ok: false, reason: 'no_space' };

	// Списываем токены атомарно (guard по балансу), затем кладём предмет.
	const raw = await db
		.update(users)
		.set({ tokens: sql`${users.tokens} - ${price}` })
		.where(and(eq(users.id, user.id), gte(users.tokens, price)));

	const header = (Array.isArray(raw) ? raw[0] : raw) as { affectedRows?: number };
	if ((header?.affectedRows ?? 0) !== 1) return { ok: false, reason: 'no_tokens' };

	await db.insert(inventoryItems).values({ userId: user.id, itemKey: id });

	const notice = `🛒 Куплен ${label(id)} за ${price} 🪙`;
	await logEvent(user.id, 'merchant', notice);
	return { ok: true, notice };
}

/** Продать предмет за токены. */
export async function sellItem(user: User, itemId: string): Promise<TradeResult> {
	if (user.diedAt !== null) return { ok: false, reason: 'dead' };
	if (!isMerchantOpen()) return { ok: false, reason: 'closed' };
	if (!SELLABLE.includes(itemId as DropItemId)) return { ok: false, reason: 'not_sellable' };

	const id = itemId as DropItemId;
	const price = DROP[id].cost;

	// Сначала убираем предмет, затем начисляем токены.
	const consumed = await consumeOneItem(user.id, id);
	if (!consumed) return { ok: false, reason: 'no_item' };

	await db
		.update(users)
		.set({ tokens: sql`${users.tokens} + ${price}` })
		.where(eq(users.id, user.id));

	const notice = `💰 Продан ${label(id)} за ${price} 🪙`;
	await logEvent(user.id, 'merchant', notice);
	return { ok: true, notice };
}
