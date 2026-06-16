import { randomBytes } from 'node:crypto';
import { redis } from '$lib/server/redis';

export const SESSION_COOKIE = 'session';
/** Время жизни сессии — 30 дней (в секундах). */
export const SESSION_TTL = 60 * 60 * 24 * 30;

const KEY = (token: string) => `session:${token}`;

/** Создаёт сессию в Redis и возвращает токен для cookie. */
export async function createSession(userId: number): Promise<string> {
	const token = randomBytes(32).toString('hex');
	await redis.set(KEY(token), String(userId), 'EX', SESSION_TTL);
	return token;
}

/** Возвращает id пользователя по токену сессии (или null). */
export async function getSessionUserId(token: string): Promise<number | null> {
	const value = await redis.get(KEY(token));
	return value ? Number(value) : null;
}

/** Удаляет сессию (logout). */
export async function deleteSession(token: string): Promise<void> {
	await redis.del(KEY(token));
}
