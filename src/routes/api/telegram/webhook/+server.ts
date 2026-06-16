import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { handleUpdate, type TelegramUpdate } from '$lib/server/bot';
import { reportError } from '$lib/server/hawk';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// Верификация секретного токена из setWebhook.
	const secret = env.TELEGRAM_WEBHOOK_SECRET;
	if (secret && request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
		throw error(401, 'Unauthorized');
	}

	let update: TelegramUpdate;
	try {
		update = (await request.json()) as TelegramUpdate;
	} catch {
		return json({ ok: true });
	}

	// Обработка не должна заставлять Telegram ретраить — всегда 200.
	try {
		await handleUpdate(update);
	} catch (err) {
		console.error('[bot] ошибка обработки апдейта:', err);
		reportError(err, { where: 'telegram-webhook' });
	}

	return json({ ok: true });
};
