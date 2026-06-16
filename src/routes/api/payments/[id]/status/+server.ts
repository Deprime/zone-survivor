import { error, json } from '@sveltejs/kit';
import { getPaymentForUser } from '$lib/server/payments/service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const id = Number(params.id);
	const payment = id ? await getPaymentForUser(id, locals.user.id) : undefined;
	if (!payment) throw error(404, 'Not found');

	return json({ status: payment.status, purpose: payment.purpose });
};
