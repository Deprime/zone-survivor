import { fail } from '@sveltejs/kit';
import { and, gte, lte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { graves } from '$lib/server/db/schema';
import { getUserById } from '$lib/server/users';
import { computeAliveState, killUser, pressAlive } from '$lib/server/game/alive';
import { getDeathInfo, inscribeGrave, resurrectWithCross } from '$lib/server/game/resurrection';
import { MAP_SIZE, MAP_VIEW_RADIUS } from '$lib/constants/game';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	let u = user;
	const state = computeAliveState(u);

	// Ленивая фиксация смерти + надгробие, если время вышло.
	if (state.status === 'dead' && u.diedAt === null) {
		await killUser(u, state.diesAt);
		u = (await getUserById(u.id)) ?? u;
	}

	// Окно мини-карты вокруг игрока.
	const R = MAP_VIEW_RADIUS;
	const minX = Math.max(0, u.posX - R);
	const maxX = Math.min(MAP_SIZE - 1, u.posX + R);
	const minY = Math.max(0, u.posY - R);
	const maxY = Math.min(MAP_SIZE - 1, u.posY + R);

	const nearbyGraves = await db
		.select({ x: graves.x, y: graves.y, looted: graves.looted })
		.from(graves)
		.where(and(gte(graves.x, minX), lte(graves.x, maxX), gte(graves.y, minY), lte(graves.y, maxY)));

	return {
		alive: state,
		pos: { x: u.posX, y: u.posY },
		graves: nearbyGraves,
		death: state.status === 'dead' ? await getDeathInfo(u) : null
	};
};

export const actions: Actions = {
	// Нажатие «Я жив».
	press: async ({ locals }) => {
		if (!locals.user) return fail(401, { reason: 'unauthorized' });
		const result = await pressAlive(locals.user.id);
		if (!result.ok) return fail(400, { reason: result.reason });
		return {
			success: true,
			x: result.x,
			y: result.y,
			event: result.event,
			threat: result.threat,
			notices: result.notices
		};
	},

	// Надпись на надгробии (в окне после гибели).
	inscribe: async ({ locals, request }) => {
		if (!locals.user) return fail(401, { reason: 'unauthorized' });
		const form = await request.formData();
		const text = String(form.get('text') ?? '');
		const ok = await inscribeGrave(locals.user, text);
		if (!ok) return fail(400, { reason: 'cannot_inscribe' });
		return { inscribed: true, notices: ['🪦 Надпись на надгробии сохранена'] };
	},

	// Бесплатное воскрешение «Крестом воскрешения».
	reviveCross: async ({ locals }) => {
		if (!locals.user) return fail(401, { reason: 'unauthorized' });
		const result = await resurrectWithCross(locals.user);
		if (!result.ok) return fail(400, { reason: result.reason });
		return { revived: true, notices: [result.notice] };
	}
};
