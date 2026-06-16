import { Redis } from 'ioredis';
import { env } from '$env/dynamic/private';
import { reportError } from '$lib/server/hawk';

if (!env.REDIS_URL) {
	throw new Error('REDIS_URL не задан в .env');
}

// Один клиент на процесс (и переживает HMR в dev, чтобы не плодить соединения).
const globalForRedis = globalThis as unknown as { __redis?: Redis };

function createClient(): Redis {
	const client = new Redis(env.REDIS_URL);
	// Без слушателя 'error' ioredis пишет «Unhandled error event».
	// Сюда же прилетит NOAUTH/таймауты — логируем и отправляем в Hawk.
	client.on('error', (err) => {
		console.error('[redis] ошибка соединения:', err.message);
		reportError(err, { where: 'redis' });
	});
	return client;
}

export const redis = globalForRedis.__redis ?? createClient();
if (import.meta.env.DEV) globalForRedis.__redis = redis;
