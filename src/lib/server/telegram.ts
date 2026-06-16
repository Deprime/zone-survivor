import ky from 'ky';
import { env } from '$env/dynamic/private';

const API = (token: string, method: string) => `https://api.telegram.org/bot${token}/${method}`;

/** Экранирование для parse_mode=HTML. */
export function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Отправляет сообщение в канал (бот должен быть админом канала). */
export async function sendChannelMessage(text: string): Promise<void> {
	const token = env.TELEGRAM_BOT_TOKEN;
	const chatId = env.TELEGRAM_CHANNEL_ID;
	if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN/TELEGRAM_CHANNEL_ID не заданы');

	await ky.post(API(token, 'sendMessage'), {
		json: {
			chat_id: chatId,
			text,
			parse_mode: 'HTML',
			disable_web_page_preview: true
		}
	});
}

/** Регистрирует webhook бота на Bot API (одноразовая настройка). */
export async function setWebhook(url: string, secretToken?: string): Promise<unknown> {
	const token = env.TELEGRAM_BOT_TOKEN;
	if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');

	return ky
		.post(API(token, 'setWebhook'), {
			json: { url, secret_token: secretToken || undefined, allowed_updates: ['message'] }
		})
		.json();
}

/**
 * Личное сообщение пользователю в его чат с ботом.
 * Доставится только если пользователь ранее нажал Start у бота.
 */
export async function sendDirectMessage(chatId: number, text: string): Promise<void> {
	const token = env.TELEGRAM_BOT_TOKEN;
	if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');

	await ky.post(API(token, 'sendMessage'), {
		json: {
			chat_id: chatId,
			text,
			parse_mode: 'HTML',
			disable_web_page_preview: true
		}
	});
}
