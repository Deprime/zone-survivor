import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sweepDeaths } from '$lib/server/game/sweep';
import type { RequestHandler } from './$types';

/**
 * Ручной/внешний запуск sweep (например, из cron Railway или cron-job.org).
 * Защита: заголовок `Authorization: Bearer <CRON_SECRET>` или `?key=<CRON_SECRET>`.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	const secret = env.CRON_SECRET;
	if (!secret) throw error(500, 'CRON_SECRET не задан');

	const provided =
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? url.searchParams.get('key');

	if (provided !== secret) throw error(401, 'Unauthorized');

	const swept = await sweepDeaths();
	return json({ swept });
};
