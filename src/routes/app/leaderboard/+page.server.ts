import { getLeaderboard } from '$lib/server/game/leaderboard';
import { getActiveSeason, getLatestWinners } from '$lib/server/game/season';
import { LEADERBOARD_PRIZE_TOP, LEADERBOARD_TTL_SECONDS } from '$lib/constants/game';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [leaderboard, season, winners] = await Promise.all([
		getLeaderboard(),
		getActiveSeason(),
		getLatestWinners()
	]);

	return {
		leaderboard,
		prizeTop: LEADERBOARD_PRIZE_TOP,
		ttl: LEADERBOARD_TTL_SECONDS,
		season: { id: season.id, endsAt: season.endsAt },
		winners
	};
};
