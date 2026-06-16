import { and, desc, eq, isNull, lte } from 'drizzle-orm';
import { PUBLIC_SEASON_START } from '$env/static/public';
import { db } from '$lib/server/db';
import { graves, inventoryItems, seasonWinners, seasons, users, type Season } from '$lib/server/db/schema';
import { redis } from '$lib/server/redis';
import {
	LEADERBOARD_PRIZE_TOP,
	MAP_START,
	SEASON_DURATION_DAYS,
	SEASON_PRIZES
} from '$lib/constants/game';

const DURATION = SEASON_DURATION_DAYS * 24 * 60 * 60;

function envStartSec(): number {
	const t = new Date(PUBLIC_SEASON_START).getTime();
	return Number.isNaN(t) ? Math.floor(Date.now() / 1000) : Math.floor(t / 1000);
}

// Короткий in-memory кэш активного сезона (меняется раз в месяц).
let cache: { season: Season; at: number } | null = null;

async function selectActive(): Promise<Season | undefined> {
	const [s] = await db
		.select()
		.from(seasons)
		.where(eq(seasons.status, 'active'))
		.orderBy(desc(seasons.id))
		.limit(1);
	return s;
}

/** Активный сезон; при отсутствии — создаёт первый (старт из PUBLIC_SEASON_START). */
export async function getActiveSeason(): Promise<Season> {
	if (cache && Date.now() - cache.at < 30_000) return cache.season;

	let season = await selectActive();
	if (!season) {
		// Лок, чтобы при холодном старте не создать два активных сезона.
		const lock = await redis.set('season:bootstrap', '1', 'EX', 10, 'NX').catch(() => null);
		if (lock === 'OK') {
			const startsAt = envStartSec();
			await db.insert(seasons).values({ startsAt, endsAt: startsAt + DURATION, status: 'active' });
		} else {
			await new Promise((r) => setTimeout(r, 300)); // ждём другой инстанс
		}
		season = await selectActive();
		if (!season) {
			const startsAt = envStartSec();
			await db.insert(seasons).values({ startsAt, endsAt: startsAt + DURATION, status: 'active' });
			season = await selectActive();
		}
	}
	if (!season) throw new Error('Не удалось получить активный сезон');

	cache = { season, at: Date.now() };
	return season;
}

/**
 * Если активный сезон истёк — финализирует его (записывает топ-5 победителей),
 * полностью сбрасывает игроков и стартует следующий сезон. Идемпотентно.
 * @returns id завершённого сезона или null.
 */
export async function endSeasonIfDue(): Promise<number | null> {
	const now = Math.floor(Date.now() / 1000);

	const [due] = await db
		.select()
		.from(seasons)
		.where(and(eq(seasons.status, 'active'), lte(seasons.endsAt, now)))
		.orderBy(desc(seasons.id))
		.limit(1);
	if (!due) return null;

	// Помечаем finished только если ещё active — защита от двойной финализации.
	const raw = await db
		.update(seasons)
		.set({ status: 'finished', finishedAt: now })
		.where(and(eq(seasons.id, due.id), eq(seasons.status, 'active')));
	const header = (Array.isArray(raw) ? raw[0] : raw) as { affectedRows?: number };
	if ((header?.affectedRows ?? 0) !== 1) return null;

	// Топ-5 живых по токенам → победители.
	const top = await db
		.select({ id: users.id, tokens: users.tokens })
		.from(users)
		.where(isNull(users.diedAt))
		.orderBy(desc(users.tokens))
		.limit(LEADERBOARD_PRIZE_TOP);

	for (let i = 0; i < top.length; i++) {
		await db.insert(seasonWinners).values({
			seasonId: due.id,
			userId: top[i].id,
			rank: i + 1,
			tokens: top[i].tokens,
			prize: SEASON_PRIZES[i + 1] ?? 'Приз'
		});
	}

	// Полный сброс прогресса игроков (аккаунты сохраняются).
	await db.update(users).set({
		tokens: 0,
		posX: MAP_START,
		posY: MAP_START,
		diedAt: null,
		biteMovesLeft: null,
		zombieWeek: null,
		revivals: 0,
		inventorySize: 4,
		activeAt: now
	});
	await db.delete(inventoryItems);
	await db.delete(graves);

	// Старт следующего сезона.
	await db.insert(seasons).values({ startsAt: now, endsAt: now + DURATION, status: 'active' });

	// Сброс кэшей.
	cache = null;
	try {
		await redis.del('leaderboard');
	} catch {
		/* некритично */
	}

	return due.id;
}

export interface WinnerRow {
	rank: number;
	name: string;
	tokens: number;
	prize: string;
}

/** Победители последнего завершённого сезона (для отображения). */
export async function getLatestWinners(): Promise<{ seasonId: number; winners: WinnerRow[] } | null> {
	const [last] = await db
		.select()
		.from(seasons)
		.where(eq(seasons.status, 'finished'))
		.orderBy(desc(seasons.id))
		.limit(1);
	if (!last) return null;

	const rows = await db
		.select({
			rank: seasonWinners.rank,
			tokens: seasonWinners.tokens,
			prize: seasonWinners.prize,
			username: users.username,
			userId: users.id
		})
		.from(seasonWinners)
		.innerJoin(users, eq(seasonWinners.userId, users.id))
		.where(eq(seasonWinners.seasonId, last.id))
		.orderBy(seasonWinners.rank);

	return {
		seasonId: last.id,
		winners: rows.map((r) => ({
			rank: r.rank,
			name: r.username ?? `Выживший #${r.userId}`,
			tokens: r.tokens,
			prize: r.prize
		}))
	};
}
