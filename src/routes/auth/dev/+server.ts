import { dev } from '$app/environment';
import { error, redirect } from '@sveltejs/kit';
import { createSession, SESSION_COOKIE, SESSION_TTL } from '$lib/server/auth/session';
import { createUser, getUserByTelegramId } from '$lib/server/users';
import type { RequestHandler } from './$types';

/**
 * Локальная dev-авторизация замоканным пользователем.
 * Доступна ТОЛЬКО при `dev === true` (vite dev) — в проде эндпоинт отдаёт 404.
 *
 * Использование: открыть /auth/dev (или /auth/dev?n=2 для второго тест-аккаунта).
 * Создаёт фейкового пользователя с предсказуемым telegram_id и выдаёт настоящую
 * сессию через ту же логику, что и Telegram-callback.
 */
const DEV_TELEGRAM_BASE = 990_000_000;

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!dev) throw error(404, 'Not found');

	// Несколько тестовых аккаунтов: /auth/dev?n=1..99 (по умолчанию 1).
	const n = Math.min(99, Math.max(1, Number(url.searchParams.get('n')) || 1));
	const telegramId = DEV_TELEGRAM_BASE + n;

	let user = await getUserByTelegramId(telegramId);
	if (!user) {
		user = await createUser({
			telegramId,
			chatId: telegramId,
			username: `dev_player_${n}`,
			parentId: null
		});
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
