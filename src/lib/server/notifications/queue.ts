import { Queue, type ConnectionOptions, type JobsOptions } from 'bullmq';
import { env } from '$env/dynamic/private';

export const NOTIFY_QUEUE = 'notifications';

/** Виды персональных уведомлений. */
export type NotificationJob =
	| { type: 'bite'; chatId: number; movesLeft: number }
	| { type: 'death'; chatId: number }
	| { type: 'active_reminder'; userId: number; activeAt: number }
	| { type: 'death_warning'; userId: number; activeAt: number };

/** Параметры подключения BullMQ к нашему Redis (из REDIS_URL). */
export function bullConnection(): ConnectionOptions {
	const url = env.REDIS_URL;
	if (!url) throw new Error('REDIS_URL не задан');
	const u = new URL(url);
	return {
		host: u.hostname,
		port: Number(u.port || 6379),
		username: u.username || undefined,
		password: u.password || undefined,
		db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0,
		...(u.protocol === 'rediss:' ? { tls: {} } : {}),
		// требование BullMQ для блокирующих команд
		maxRetriesPerRequest: null
	};
}

const DEFAULT_JOB_OPTS: JobsOptions = {
	attempts: 5,
	backoff: { type: 'exponential', delay: 3000 },
	removeOnComplete: { count: 1000 },
	removeOnFail: { count: 5000 }
};

// Singleton очереди (переживает HMR в dev).
const globalForQueue = globalThis as unknown as { __notifyQueue?: Queue<NotificationJob> };

function getQueue(): Queue<NotificationJob> {
	if (!globalForQueue.__notifyQueue) {
		globalForQueue.__notifyQueue = new Queue<NotificationJob>(NOTIFY_QUEUE, {
			connection: bullConnection(),
			defaultJobOptions: DEFAULT_JOB_OPTS
		});
	}
	return globalForQueue.__notifyQueue;
}

/** Кладёт уведомление в очередь. Ошибки очереди не должны ломать игровую логику. */
export async function enqueueNotification(
	job: NotificationJob,
	opts?: JobsOptions
): Promise<void> {
	try {
		await getQueue().add(job.type, job, opts);
	} catch (err) {
		console.error('[notify] не удалось поставить задачу в очередь:', err);
	}
}
