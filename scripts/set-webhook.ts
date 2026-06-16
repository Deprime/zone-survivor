import 'dotenv/config';
import ky from 'ky';

/**
 * Одноразовая регистрация webhook бота.
 * Запуск: `bun run bot:set-webhook`
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const site = process.env.PUBLIC_SITE_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');
if (!site) throw new Error('PUBLIC_SITE_URL не задан');

const url = `${site.replace(/\/$/, '')}/api/telegram/webhook`;

const res = await ky
	.post(`https://api.telegram.org/bot${token}/setWebhook`, {
		json: { url, secret_token: secret || undefined, allowed_updates: ['message'] }
	})
	.json();

console.log('setWebhook →', url);
console.log(res);
