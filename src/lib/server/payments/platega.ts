import ky from 'ky';
import { env } from '$env/dynamic/private';

const baseUrl = () => (env.PLATEGA_BASE_URL || 'https://app.platega.io').replace(/\/$/, '');

function authHeaders(): Record<string, string> {
	const merchantId = env.PLATEGA_MERCHANT_ID;
	const secret = env.PLATEGA_SECRET;
	if (!merchantId || !secret) throw new Error('PLATEGA_MERCHANT_ID/PLATEGA_SECRET не заданы');
	return { 'X-MerchantId': merchantId, 'X-Secret': secret };
}

export interface CreatePaymentInput {
	amount: number;
	description: string;
	returnUrl: string;
	failedUrl: string;
	/** Наши данные для сверки (id нашего платежа). */
	payload: string;
	method?: number;
}

export interface CreatePaymentResult {
	transactionId: string;
	redirect: string;
	status: string;
}

/** Создаёт транзакцию с заданным методом (POST /transaction/process). */
export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
	const method = input.method ?? Number(env.PLATEGA_METHOD ?? 2);

	const res = await ky
		.post(`${baseUrl()}/transaction/process`, {
			headers: authHeaders(),
			json: {
				paymentMethod: method,
				paymentDetails: { amount: input.amount, currency: 'RUB' },
				description: input.description,
				return: input.returnUrl,
				failedUrl: input.failedUrl,
				payload: input.payload
			}
		})
		.json<{ transactionId: string; redirect: string; status: string }>();

	return { transactionId: res.transactionId, redirect: res.redirect, status: res.status };
}

/** Проверяет заголовки callback (X-MerchantId / X-Secret). */
export function verifyCallbackAuth(merchantId: string | null, secret: string | null): boolean {
	return (
		!!env.PLATEGA_MERCHANT_ID &&
		!!env.PLATEGA_SECRET &&
		merchantId === env.PLATEGA_MERCHANT_ID &&
		secret === env.PLATEGA_SECRET
	);
}
