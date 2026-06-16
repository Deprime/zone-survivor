import type { Handle, HandleServerError } from '@sveltejs/kit';
import { SESSION_COOKIE, SESSION_TTL, getSessionUserId } from '$lib/server/auth/session';
import { getUserById } from '$lib/server/users';
import { initHawk, reportError } from '$lib/server/hawk';
import {
	startDeathDigestJob,
	startDeathSweeper,
	startLeaderboardRefresher,
	startSeasonWatcher
} from '$lib/server/game/scheduler';
import { startNotificationWorker } from '$lib/server/notifications/worker';

// Запускаются один раз при старте сервера.
initHawk();
startDeathSweeper();
startLeaderboardRefresher();
startSeasonWatcher();
startDeathDigestJob();
startNotificationWorker();

/**
 * Ловит все НЕОЖИДАННЫЕ ошибки серверных load/action/endpoint (в т.ч. колбэка
 * авторизации) и отправляет их в Hawk. Ожидаемые `error(4xx/5xx)` сюда не попадают.
 */
export const handleError: HandleServerError = ({ error, event, status }) => {
	reportError(error, {
		path: event.url.pathname,
		method: event.request.method,
		status,
		userId: event.locals.user?.id ?? null
	});
	console.error(`[error] ${status} ${event.url.pathname}:`, error);

	return { message: 'Внутренняя ошибка сервера. Мы уже разбираемся.' };
};

export const handle: Handle = async ({ event, resolve }) => {
	// Реферальная ссылка: ?ref=<uuid> — запоминаем в cookie до регистрации.
	const ref = event.url.searchParams.get('ref');
	if (ref) {
		event.cookies.set('ref', ref, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: SESSION_TTL
		});
	}

	// Текущая сессия → пользователь в locals. Ошибки БД/Redis не должны ронять сайт.
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		try {
			const userId = await getSessionUserId(token);
			if (userId) {
				const user = await getUserById(userId);
				event.locals.user = user ?? null;
			}
		} catch (err) {
			console.error('Не удалось загрузить сессию:', err);
			reportError(err, { where: 'session-load' });
		}
	}

	return resolve(event);
};
