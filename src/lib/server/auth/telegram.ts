import crypto from 'node:crypto';

export interface TelegramAuthData {
	id: string;
	first_name?: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
	auth_date: string;
	hash: string;
	[key: string]: string | undefined;
}

/**
 * Проверяет подпись данных Telegram Login Widget.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function checkTelegramAuth(data: Record<string, string>, botToken: string): boolean {
	const { hash, ...fields } = data;
	if (!hash) return false;

	const dataCheckString = Object.keys(fields)
		.sort()
		.map((key) => `${key}=${fields[key]}`)
		.join('\n');

	const secretKey = crypto.createHash('sha256').update(botToken).digest();
	const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

	// Сравнение в постоянное время, чтобы избежать тайминг-атак.
	const a = Buffer.from(hmac, 'hex');
	const b = Buffer.from(hash, 'hex');
	if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

	// Данные не старше 24 часов.
	const authDate = Number(fields.auth_date);
	if (!authDate || Math.floor(Date.now() / 1000) - authDate > 86_400) return false;

	return true;
}
