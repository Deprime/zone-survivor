import { Redis } from 'ioredis';
import { env } from '$env/dynamic/private';

if (!env.REDIS_URL) {
	throw new Error('REDIS_URL не задан в .env');
}

// Один клиент на процесс (и переживает HMR в dev, чтобы не плодить соединения).
const globalForRedis = globalThis as unknown as { __redis?: Redis };

export const redis = globalForRedis.__redis ?? new Redis(env.REDIS_URL);
if (import.meta.env.DEV) globalForRedis.__redis = redis;
