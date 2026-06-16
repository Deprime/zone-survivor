import { error, json } from '@sveltejs/kit';
import { verifyCallbackAuth } from '$lib/server/payments/platega';
import { handleCallback, type PlategaCallback } from '$lib/server/payments/service';
import type { RequestHandler } from './$types';

/**
 * Callback Platega об изменении статуса транзакции.
 * URL указать в ЛК Platega (Настройки → Callback URLs): {site}/api/payments/platega/callback
 * Заголовки X-MerchantId / X-Secret верифицируются. Всегда отвечаем 200.
 */
export const POST: RequestHandler = async ({ request }) => {
	const merchantId = request.headers.get('x-merchantid');
	const secret = request.headers.get('x-secret');
	if (!verifyCallbackAuth(merchantId, secret)) throw error(401, 'Unauthorized');

	let body: PlategaCallback;
	try {
		body = (await request.json()) as PlategaCallback;
	} catch {
		return json({ ok: true });
	}

	try {
		await handleCallback(body);
	} catch (err) {
		console.error('[pay] ошибка обработки callback:', err);
	}

	return json({ ok: true });
};
