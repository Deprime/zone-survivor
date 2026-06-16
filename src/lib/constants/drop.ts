/**
 * Предметы дропа ZombieLand survivor.
 * Переиспользуется на фронтенде и в backend (события клеток, торговец, награды).
 *
 * Поля предмета:
 *  - key        — уникальный ключ для локализации (i18n), не показывается как есть;
 *  - dropChance — вероятность выпадения в процентах (0..100);
 *  - cost       — стоимость в токенах (для торговца).
 */
export interface DropItem {
	key: string;
	dropChance: number;
	cost: number;
}

export const DROP = {
	ammo: { key: 'item.ammo', dropChance: 18, cost: 5 },
	antidote: { key: 'item.antidote', dropChance: 10, cost: 12 },
	loot: { key: 'item.loot', dropChance: 25, cost: 8 },
	// Крест воскрешения: dropChance = 0 — его нельзя найти, только выдаётся за достижение.
	resurrection_cross: { key: 'item.resurrection_cross', dropChance: 0, cost: 0 }
} as const satisfies Record<string, DropItem>;

export type DropItemId = keyof typeof DROP;

/** Идентификатор «Креста воскрешения» (награда за 10 рефералов). */
export const RESURRECTION_CROSS: DropItemId = 'resurrection_cross';
