import { fail } from '@sveltejs/kit';
import { buyItem, getMerchantState, sellItem } from '$lib/server/game/merchant';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	return { merchant: await getMerchantState(user) };
};

export const actions: Actions = {
	buy: async ({ locals, request }) => {
		if (!locals.user) return fail(401, { reason: 'unauthorized' });
		const itemId = String((await request.formData()).get('itemId') ?? '');
		const result = await buyItem(locals.user, itemId);
		if (!result.ok) return fail(400, { reason: result.reason });
		return { traded: 'buy', itemId, notices: [result.notice] };
	},

	sell: async ({ locals, request }) => {
		if (!locals.user) return fail(401, { reason: 'unauthorized' });
		const itemId = String((await request.formData()).get('itemId') ?? '');
		const result = await sellItem(locals.user, itemId);
		if (!result.ok) return fail(400, { reason: result.reason });
		return { traded: 'sell', itemId, notices: [result.notice] };
	}
};
