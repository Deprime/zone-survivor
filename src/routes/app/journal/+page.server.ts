import { getRecentEvents } from '$lib/server/game/journal';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	return { events: await getRecentEvents(user.id, 100) };
};
