import { desc, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { redis } from '$lib/server/redis';
import { LEADERBOARD_SIZE, LEADERBOARD_TTL_SECONDS } from '$lib/constants/game';

export interface LeaderboardEntry {
	rank: number;
	name: string;
	tokens: number;
}

export interface LeaderboardSnapshot {
	entries: LeaderboardEntry[];
	/** unixtime (сек), когда снимок сформирован. */
	generatedAt: number;
}

const KEY = 'leaderboard';

/** Считает лидерчарт: живые игроки по убыванию токенов. */
export async function computeLeaderboard(): Promise<LeaderboardSnapshot> {
	const rows = await db
		.select({ id: users.id, username: users.username, tokens: users.tokens })
		.from(users)
		.where(isNull(users.diedAt))
		.orderBy(desc(users.tokens))
		.limit(LEADERBOARD_SIZE);

	const entries: LeaderboardEntry[] = rows.map((r, i) => ({
		rank: i + 1,
		name: r.username ?? `Выживший #${r.id}`,
		tokens: r.tokens
	}));

	return { entries, generatedAt: Math.floor(Date.now() / 1000) };
}

/** Принудительно пересчитывает снимок и кладёт в Redis на 1 час. */
export async function refreshLeaderboard(): Promise<LeaderboardSnapshot> {
	const snapshot = await computeLeaderboard();
	try {
		await redis.set(KEY, JSON.stringify(snapshot), 'EX', LEADERBOARD_TTL_SECONDS);
	} catch {
		/* Redis-кэш некритичен */
	}
	return snapshot;
}

/** Возвращает снимок из кэша; если его нет — считает и кэширует. */
export async function getLeaderboard(): Promise<LeaderboardSnapshot> {
	try {
		const cached = await redis.get(KEY);
		if (cached) return JSON.parse(cached) as LeaderboardSnapshot;
	} catch {
		/* при недоступности кэша считаем напрямую */
	}
	return refreshLeaderboard();
}
