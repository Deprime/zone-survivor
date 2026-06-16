import { fail, redirect } from '@sveltejs/kit';
import { quotePurchase, startPayment, type Purpose } from '$lib/server/payments/service';
import type { Actions, PageServerLoad } from './$types';

function parsePurpose(v: string | null): Purpose | null {
	return v === 'revival' || v === 'inventory' ? v : null;
}

export const load: PageServerLoad = async ({ url, parent }) => {
	const { user } = await parent();
	const purpose = parsePurpose(url.searchParams.get('for'));
	if (!purpose) return { purpose: null, quote: null };
	return { purpose, quote: quotePurchase(user, purpose) };
};

export const actions: Actions = {
	start: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Не авторизован.' });
		const purpose = parsePurpose(String((await request.formData()).get('purpose') ?? ''));
		if (!purpose) return fail(400, { error: 'Неизвестная покупка.' });

		const result = await startPayment(locals.user, purpose);
		if ('error' in result) return fail(400, { error: result.error });

		// Полная навигация на платёжную страницу Platega.
		throw redirect(303, result.redirect);
	}
};
