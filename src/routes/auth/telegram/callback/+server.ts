import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { checkTelegramAuth } from '$lib/server/auth/telegram';
import { createSession, SESSION_COOKIE, SESSION_TTL } from '$lib/server/auth/session';
import { createUser, getUserByTelegramId, getUserByUuid } from '$lib/server/users';
import { applyReferralReward } from '$lib/server/referral';
import { redis } from '$lib/server/redis';
import { pendingRefKey } from '$lib/server/bot';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!env.TELEGRAM_BOT_TOKEN) throw error(500, 'TELEGRAM_BOT_TOKEN не задан');

	const data = Object.fromEntries(url.searchParams) as Record<string, string>;
	if (!data.id || !data.hash) throw error(400, 'Некорректные данные авторизации');

	if (!checkTelegramAuth(data, env.TELEGRAM_BOT_TOKEN)) {
		throw error(403, 'Проверка подписи Telegram не пройдена');
	}

	const telegramId = Number(data.id);
	let user = await getUserByTelegramId(telegramId);

	// Первичная регистрация.
	if (!user) {
		let parentId: number | null = null;
		// Реферал: сначала cookie с сайта, иначе — pending-ref из бот-ссылки.
		let ref = cookies.get('ref');
		if (!ref) {
			try {
				ref = (await redis.get(pendingRefKey(telegramId))) ?? undefined;
			} catch {
				/* некритично */
			}
		}
		if (ref) {
			const parent = await getUserByUuid(ref);
			// Нельзя стать рефералом самого себя.
			if (parent && parent.telegramId !== telegramId) parentId = parent.id;
		}

		user = await createUser({
			telegramId,
			// Приватный чат с ботом совпадает с id пользователя.
			chatId: telegramId,
			username: data.username ?? null,
			parentId
		});

		cookies.delete('ref', { path: '/' });
		try {
			await redis.del(pendingRefKey(telegramId));
		} catch {
			/* некритично */
		}

		// Начисляем рефереру бонус (токен + крест на 10-м реферале).
		if (parentId !== null) {
			await applyReferralReward(parentId);
		}
	}

	const token = await createSession(user.id);
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: SESSION_TTL
	});

	throw redirect(303, '/app/game');
};
