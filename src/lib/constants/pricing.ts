/**
 * Экономика игры ZombieLand survivor.
 *
 * Модуль предназначен для переиспользования как на фронтенде (SvelteKit),
 * так и в backend API. Не импортирует ничего из окружения Svelte/браузера.
 */

/** Денежная единица для платных услуг. */
export const CURRENCY = '₽';

/**
 * Стоимость воскрешения персонажа по порядковому номеру попытки (в рублях).
 * Индекс 0 — первое воскрешение, индекс 1 — второе и т.д.
 */
export const REVIVAL_PRICES_RUB = [200, 300, 500] as const;

/** Максимальное количество воскрешений одного персонажа. */
export const MAX_REVIVALS = REVIVAL_PRICES_RUB.length;

/**
 * Возвращает стоимость воскрешения для указанной попытки (1-based).
 * @param attempt Номер воскрешения, начиная с 1.
 * @returns Стоимость в рублях или `null`, если лимит воскрешений исчерпан.
 */
export function getRevivalPrice(attempt: number): number | null {
	return REVIVAL_PRICES_RUB[attempt - 1] ?? null;
}

/** Базовый размер инвентаря (как в схеме users.inventory_size). */
export const BASE_INVENTORY_SIZE = 4;

/**
 * Цена каждого следующего расширения инвентаря (в рублях).
 * Всего можно докупить 4 ячейки: 4→5, 5→6, 6→7, 7→8.
 */
export const INVENTORY_EXPAND_PRICES_RUB = [200, 250, 300, 350] as const;

/** Максимальный размер инвентаря после всех расширений. */
export const MAX_INVENTORY_SIZE = BASE_INVENTORY_SIZE + INVENTORY_EXPAND_PRICES_RUB.length;

/**
 * Цена расширения инвентаря при текущем размере (null — достигнут максимум).
 */
export function getInventoryExpandPrice(currentSize: number): number | null {
	const index = currentSize - BASE_INVENTORY_SIZE;
	return INVENTORY_EXPAND_PRICES_RUB[index] ?? null;
}
