import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sendDeathDigest } from '$lib/server/game/digest';
import type { RequestHandler } from './$types';

/**
 * Ручной/внешний запуск дайджеста павших (cron Railway / cron-job.org).
 * Защита: `Authorization: Bearer <CRON_SECRET>` или `?key=<CRON_SECRET>`.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	const secret = env.CRON_SECRET;
	if (!secret) throw error(500, 'CRON_SECRET не задан');

	const provided =
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
		url.searchParams.get('key');
	if (provided !== secret) throw error(401, 'Unauthorized');

	const result = await sendDeathDigest();
	return json(result);
};
