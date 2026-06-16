import HawkCatcher from '@hawk.so/nodejs';
import { env } from '$env/dynamic/private';

let initialized = false;

/** Инициализирует Hawk один раз (если задан HAWK_TOKEN). */
export function initHawk(): void {
	if (initialized) return;
	const token = env.HAWK_TOKEN;
	if (!token) return; // без токена — логирование отключено

	HawkCatcher.init({ token });
	initialized = true;
}

/**
 * Отправляет ошибку в Hawk. Если catcher не инициализирован — no-op.
 * Сам логгер не должен ломать поток выполнения.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
	try {
		const err = error instanceof Error ? error : new Error(String(error));
		HawkCatcher.send(err, context);
	} catch {
		/* проглатываем — логгер не критичен */
	}
}
