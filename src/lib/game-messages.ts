/**
 * Человекочитаемые сообщения игровых событий.
 * Чистый модуль — без серверных зависимостей, импортируется и на клиенте, и на сервере.
 */

export type CellEventLike = { type: string; amount?: number; itemId?: string };
export type ThreatLike = { type: string; movesLeft?: number };

export const ITEM_LABEL: Record<string, string> = {
	ammo: 'патрон',
	antidote: 'антидот',
	loot: 'лут',
	resurrection_cross: 'крест воскрешения'
};

const itemName = (id?: string) => ITEM_LABEL[id ?? ''] ?? id ?? 'предмет';

/** Сообщение о событии клетки (пустая строка — событие без текста). */
export function cellEventMessage(e: CellEventLike): string {
	switch (e.type) {
		case 'tokens':
			return `Найден ящик: +${e.amount} 🪙`;
		case 'grave':
			return `Разграблена могила: +${e.amount} 🪙`;
		case 'item':
			return `Найден предмет: ${itemName(e.itemId)}`;
		case 'item_lost':
			return `Найден ${itemName(e.itemId)}, но инвентарь полон`;
		default:
			return '';
	}
}

/** Сообщение об угрозе хода (null — угрозы нет). */
export function threatMessage(t: ThreatLike): string | null {
	switch (t.type) {
		case 'zombie_killed':
			return '🧟 Зомби устранён патроном — без последствий';
		case 'zombie_bite':
			return `🧟 Укус зомби! Заражение — найди антидот за ${t.movesLeft} хода`;
		case 'infection_cured':
			return '💉 Антидот применён — заражение вылечено';
		case 'infection_progress':
			return `☣️ Заражение прогрессирует, до гибели ${t.movesLeft} хода`;
		case 'infection_death':
			return '☠️ Антидот не найден — гибель от заражения';
		default:
			return null;
	}
}
