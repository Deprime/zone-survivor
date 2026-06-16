import { getPaymentForUser } from '$lib/server/payments/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const id = Number(url.searchParams.get('id'));
	const payment = locals.user && id ? await getPaymentForUser(id, locals.user.id) : undefined;
	if (!payment) return { payment: null };

	return {
		payment: {
			id: payment.id,
			purpose: payment.purpose,
			status: payment.status,
			amountRub: payment.amountRub
		}
	};
};
