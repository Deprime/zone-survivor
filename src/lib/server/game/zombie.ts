import { ZOMBIE_FROM_SEASON_WEEK, ZOMBIE_GRACE_MOVES } from '$lib/constants/game';
import type { User } from '$lib/server/db/schema';
import { consumeOneItem } from './world';

export type ThreatEvent =
	| { type: 'none' }
	| { type: 'zombie_killed' } // отстрелялся патроном
	| { type: 'zombie_bite'; movesLeft: number } // укушен, заражён
	| { type: 'infection_cured' } // применил антидот
	| { type: 'infection_progress'; movesLeft: number } // тикает счётчик
	| { type: 'infection_death' }; // не нашёл антидот за 3 хода

export interface ThreatOutcome {
	threat: ThreatEvent;
	/** Новое значение bite_moves_left, если изменилось (null = вылечен). */
	setBiteMovesLeft?: number | null;
	/** Новое значение zombie_week, если встреча состоялась. */
	setZombieWeek?: string;
	/** Нужно ли зафиксировать смерть от заражения. */
	death: boolean;
}

/** ISO-неделя в формате YYYY-WW (UTC). */
export function isoWeek(d = new Date()): string {
	const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
	const dayNum = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
	const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
	return `${date.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}

/** Зомби активны со 2-й недели сезона (по старту активного сезона). */
function zombiesActive(nowMs: number, seasonStartSec: number): boolean {
	return nowMs >= seasonStartSec * 1000 + (ZOMBIE_FROM_SEASON_WEEK - 1) * 7 * 86_400_000;
}

/** Целевой день недели встречи: 2=вт, 3=ср, 4=чт (стабильно для игрока+недели). */
function targetDay(userId: number, weekKey: string): number {
	let h = userId * 31;
	for (const ch of weekKey) h += ch.charCodeAt(0);
	return 2 + (Math.abs(h) % 3);
}

/** Пора ли выдать недельного зомби (раз в ISO-неделю, не раньше целевого дня). */
function isZombieDue(user: Pick<User, 'id' | 'zombieWeek'>, weekKey: string, now: Date): boolean {
	if (user.zombieWeek === weekKey) return false; // уже была на этой неделе
	const isoDow = now.getUTCDay() === 0 ? 7 : now.getUTCDay(); // Пн=1..Вс=7
	return isoDow >= targetDay(user.id, weekKey);
}

/**
 * Разрешает угрозу на текущем ходу:
 *  - если игрок заражён — лечит антидотом, иначе тикает счётчик до смерти;
 *  - иначе проверяет гарантированную недельную встречу зомби (патрон спасает).
 * Списывает предметы как побочный эффект; изменения полей пользователя
 * возвращает для единого UPDATE в pressAlive.
 */
export async function resolveThreat(
	user: Pick<User, 'id' | 'biteMovesLeft' | 'zombieWeek'>,
	seasonStartSec: number
): Promise<ThreatOutcome> {
	const now = new Date();
	const weekKey = isoWeek(now);

	// Уже заражён.
	if (user.biteMovesLeft !== null) {
		const cured = await consumeOneItem(user.id, 'antidote');
		if (cured) {
			return { threat: { type: 'infection_cured' }, setBiteMovesLeft: null, death: false };
		}
		const left = user.biteMovesLeft - 1;
		if (left <= 0) {
			return { threat: { type: 'infection_death' }, death: true };
		}
		return {
			threat: { type: 'infection_progress', movesLeft: left },
			setBiteMovesLeft: left,
			death: false
		};
	}

	// Здоров — гарантированная недельная встреча.
	if (zombiesActive(now.getTime(), seasonStartSec) && isZombieDue(user, weekKey, now)) {
		const killed = await consumeOneItem(user.id, 'ammo');
		if (killed) {
			return { threat: { type: 'zombie_killed' }, setZombieWeek: weekKey, death: false };
		}
		return {
			threat: { type: 'zombie_bite', movesLeft: ZOMBIE_GRACE_MOVES },
			setBiteMovesLeft: ZOMBIE_GRACE_MOVES,
			setZombieWeek: weekKey,
			death: false
		};
	}

	return { threat: { type: 'none' }, death: false };
}
