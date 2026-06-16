import { redis } from '$lib/server/redis';
import {
	DEATH_DIGEST_HOUR_UTC,
	LEADERBOARD_TTL_SECONDS,
	SEASON_WATCH_INTERVAL_SECONDS,
	SWEEP_INTERVAL_SECONDS
} from '$lib/constants/game';
import { sweepDeaths } from './sweep';
import { refreshLeaderboard } from './leaderboard';
import { endSeasonIfDue, getActiveSeason } from './season';
import { sendDeathDigest } from './digest';
import { reportError } from '$lib/server/hawk';

const globalForSweeper = globalThis as unknown as {
	__deathSweeperStarted?: boolean;
	__leaderboardStarted?: boolean;
	__seasonWatcherStarted?: boolean;
	__deathDigestStarted?: boolean;
};

/**
 * Запускает периодический sweep смертей внутри процесса.
 * - single-flight через Redis-лок: при нескольких инстансах проход делает только один;
 * - защита от повторного запуска (HMR / повторный импорт модуля).
 */
export function startDeathSweeper(): void {
	if (globalForSweeper.__deathSweeperStarted) return;
	globalForSweeper.__deathSweeperStarted = true;

	const run = async () => {
		try {
			// Лок «живёт» почти весь интервал — один инстанс на проход.
			const acquired = await redis.set(
				'sweep:lock',
				'1',
				'EX',
				Math.max(1, SWEEP_INTERVAL_SECONDS - 1),
				'NX'
			);
			if (acquired !== 'OK') return;

			const dead = await sweepDeaths();
			if (dead > 0) console.log(`[sweep] зафиксировано смертей: ${dead}`);
		} catch (err) {
			console.error('[sweep] ошибка прохода:', err);
			reportError(err, { job: 'sweep' });
		}
	};

	const timer = setInterval(run, SWEEP_INTERVAL_SECONDS * 1000);
	// Не держим процесс из-за таймера.
	if (typeof timer.unref === 'function') timer.unref();

	// Первый прогон вскоре после старта сервера.
	setTimeout(run, 10_000);
}

/**
 * Обновляет снимок лидерчарта раз в час (single-flight через Redis-лок).
 */
export function startLeaderboardRefresher(): void {
	if (globalForSweeper.__leaderboardStarted) return;
	globalForSweeper.__leaderboardStarted = true;

	const run = async () => {
		try {
			const acquired = await redis.set(
				'leaderboard:lock',
				'1',
				'EX',
				Math.max(1, LEADERBOARD_TTL_SECONDS - 1),
				'NX'
			);
			if (acquired !== 'OK') return;
			await refreshLeaderboard();
		} catch (err) {
			console.error('[leaderboard] ошибка обновления:', err);
			reportError(err, { job: 'leaderboard' });
		}
	};

	const timer = setInterval(run, LEADERBOARD_TTL_SECONDS * 1000);
	if (typeof timer.unref === 'function') timer.unref();

	setTimeout(run, 15_000);
}

/**
 * Следит за завершением сезона: финализирует истёкший и стартует следующий.
 * Гарантирует существование первого сезона. Single-flight через Redis-лок.
 */
export function startSeasonWatcher(): void {
	if (globalForSweeper.__seasonWatcherStarted) return;
	globalForSweeper.__seasonWatcherStarted = true;

	const run = async () => {
		try {
			const acquired = await redis.set(
				'season:lock',
				'1',
				'EX',
				Math.max(1, SEASON_WATCH_INTERVAL_SECONDS - 1),
				'NX'
			);
			if (acquired !== 'OK') return;

			await getActiveSeason(); // создаёт первый сезон, если его нет
			const ended = await endSeasonIfDue();
			if (ended) console.log(`[season] сезон ${ended} завершён, начат новый`);
		} catch (err) {
			console.error('[season] ошибка:', err);
			reportError(err, { job: 'season' });
		}
	};

	const timer = setInterval(run, SEASON_WATCH_INTERVAL_SECONDS * 1000);
	if (typeof timer.unref === 'function') timer.unref();

	setTimeout(run, 20_000);
}

/**
 * Раз в сутки (после DEATH_DIGEST_HOUR_UTC) шлёт в канал список павших за день.
 * Дедуп и single-flight — через дневной Redis-ключ (SET NX); при ошибке отправки
 * ключ снимается, чтобы повторить на следующем часу.
 */
export function startDeathDigestJob(): void {
	if (globalForSweeper.__deathDigestStarted) return;
	globalForSweeper.__deathDigestStarted = true;

	const run = async () => {
		const now = new Date();
		if (now.getUTCHours() < DEATH_DIGEST_HOUR_UTC) return;

		const dateKey = `digest:sent:${now.toISOString().slice(0, 10)}`;
		try {
			const acquired = await redis.set(dateKey, '1', 'EX', 2 * 24 * 60 * 60, 'NX');
			if (acquired !== 'OK') return; // уже отправлено сегодня
			try {
				await sendDeathDigest();
			} catch (err) {
				await redis.del(dateKey); // дать шанс повторить на следующем часу
				throw err;
			}
		} catch (err) {
			console.error('[digest] ошибка отправки:', err);
			reportError(err, { job: 'death-digest' });
		}
	};

	const timer = setInterval(run, 60 * 60 * 1000); // раз в час
	if (typeof timer.unref === 'function') timer.unref();

	setTimeout(run, 25_000);
}
