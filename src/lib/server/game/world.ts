import { and, count, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { graves, inventoryItems } from '$lib/server/db/schema';
import { DROP, type DropItemId } from '$lib/constants/drop';
import {
	GRAVE_LOOT_RATIO,
	MAP_SIZE,
	TOKEN_BOX_CHANCE,
	TOKEN_BOX_MAX,
	TOKEN_BOX_MIN
} from '$lib/constants/game';

export type CellEvent =
	| { type: 'none' }
	| { type: 'tokens'; amount: number }
	| { type: 'item'; itemId: DropItemId }
	| { type: 'item_lost'; itemId: DropItemId }
	| { type: 'grave'; amount: number };

export interface Position {
	x: number;
	y: number;
}

const clamp = (n: number) => Math.max(0, Math.min(MAP_SIZE - 1, n));
const rint = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Шаг в случайную сторону (4 направления) с упором в границы карты. */
export function randomStep(x: number, y: number): Position {
	const dirs: Position[] = [
		{ x: 0, y: -1 },
		{ x: 0, y: 1 },
		{ x: -1, y: 0 },
		{ x: 1, y: 0 }
	];
	const d = dirs[Math.floor(Math.random() * dirs.length)];
	return { x: clamp(x + d.x), y: clamp(y + d.y) };
}

/**
 * Сколько предметов сейчас в инвентаре пользователя.
 * Токены здесь НЕ учитываются — они хранятся в users.tokens и не занимают клетки.
 */
export async function countInventory(userId: number): Promise<number> {
	const [row] = await db
		.select({ value: count() })
		.from(inventoryItems)
		.where(eq(inventoryItems.userId, userId));
	return Number(row?.value ?? 0);
}

/** Удаляет один предмет указанного типа из инвентаря. @returns был ли предмет. */
export async function consumeOneItem(userId: number, itemKey: DropItemId): Promise<boolean> {
	const [row] = await db
		.select({ id: inventoryItems.id })
		.from(inventoryItems)
		.where(and(eq(inventoryItems.userId, userId), eq(inventoryItems.itemKey, itemKey)))
		.limit(1);

	if (!row) return false;
	await db.delete(inventoryItems).where(eq(inventoryItems.id, row.id));
	return true;
}

// Предметы, которые реально можно найти (dropChance > 0).
const DROPPABLE = Object.entries(DROP).filter(
	([, item]) => item.dropChance > 0
) as [DropItemId, (typeof DROP)[DropItemId]][];

/**
 * Разрешает событие на клетке (модель «бросок при входе»).
 * Применяет побочные эффекты (грабёж могилы, выдача предмета) и возвращает
 * описание события + дельту токенов (применяется вызывающим в общем UPDATE).
 */
export async function resolveCellEvent(opts: {
	userId: number;
	x: number;
	y: number;
	itemCount: number;
	inventorySize: number;
}): Promise<{ event: CellEvent; tokenDelta: number }> {
	const { userId, x, y, itemCount, inventorySize } = opts;

	// 1. Чужая неразграбленная могила — забираем долю токенов павшего.
	const [grave] = await db
		.select()
		.from(graves)
		.where(and(eq(graves.x, x), eq(graves.y, y), eq(graves.looted, false), ne(graves.userId, userId)))
		.limit(1);

	if (grave) {
		const amount = Math.floor(grave.tokens * GRAVE_LOOT_RATIO);
		await db.update(graves).set({ looted: true }).where(eq(graves.id, grave.id));
		return { event: { type: 'grave', amount }, tokenDelta: amount };
	}

	// 2. Случайное событие (один бросок d100).
	let r = Math.random() * 100;

	if (r < TOKEN_BOX_CHANCE) {
		const amount = rint(TOKEN_BOX_MIN, TOKEN_BOX_MAX);
		return { event: { type: 'tokens', amount }, tokenDelta: amount };
	}
	r -= TOKEN_BOX_CHANCE;

	for (const [itemId, item] of DROPPABLE) {
		if (r < item.dropChance) {
			if (itemCount < inventorySize) {
				await db.insert(inventoryItems).values({ userId, itemKey: itemId });
				return { event: { type: 'item', itemId }, tokenDelta: 0 };
			}
			// Инвентарь полон — предмет теряется.
			return { event: { type: 'item_lost', itemId }, tokenDelta: 0 };
		}
		r -= item.dropChance;
	}

	return { event: { type: 'none' }, tokenDelta: 0 };
}
