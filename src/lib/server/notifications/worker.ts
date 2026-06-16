import { Worker, UnrecoverableError, type Job } from 'bullmq';
import { HTTPError } from 'ky';
import { PUBLIC_SITE_URL } from '$env/static/public';
import { getUserById } from '$lib/server/users';
import { sendDirectMessage } from '$lib/server/telegram';
import { NOTIFY_QUEUE, bullConnection, type NotificationJob } from './queue';

const globalForWorker = globalThis as unknown as { __notifyWorkerStarted?: boolean };

function gameLink(): string {
	const base = (PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
	return base ? `\n\nИграть: ${base}/app/game` : '';
}

/** Готовит адресата и текст; null — задача устарела (пропустить). */
async function resolve(
	job: Job<NotificationJob>
): Promise<{ chatId: number; text: string } | null> {
	const data = job.data;
	switch (data.type) {
		case 'bite':
			return {
				chatId: data.chatId,
				text: `🧟 <b>Тебя укусил зомби!</b> Найди антидот за ${data.movesLeft} хода, иначе погибнешь.${gameLink()}`
			};
		case 'death':
			return {
				chatId: data.chatId,
				text: `☠️ <b>Твой персонаж погиб.</b> В течение 24 часов можно воскреснуть или оставить надпись на надгробии.${gameLink()}`
			};
		case 'active_reminder': {
			const u = await getUserById(data.userId);
			// устарело, если игрок уже жал кнопку (activeAt сменился) или мёртв
			if (!u || u.diedAt !== null || u.activeAt !== data.activeAt) return null;
			return {
				chatId: u.chatId,
				text: `🟢 <b>Кнопка «Я жив» снова активна.</b> Отметься, чтобы выжить!${gameLink()}`
			};
		}
		case 'death_warning': {
			const u = await getUserById(data.userId);
			if (!u || u.diedAt !== null || u.activeAt !== data.activeAt) return null;
			return {
				chatId: u.chatId,
				text: `⚠️ <b>Скоро гибель!</b> Нажми «Я жив», иначе персонаж погибнет.${gameLink()}`
			};
		}
	}
}

/** Запускает воркер обработки уведомлений (один раз на процесс). */
export function startNotificationWorker(): void {
	if (globalForWorker.__notifyWorkerStarted) return;
	globalForWorker.__notifyWorkerStarted = true;

	const worker = new Worker<NotificationJob>(
		NOTIFY_QUEUE,
		async (job) => {
			const payload = await resolve(job);
			if (!payload) return; // устаревшее напоминание — тихо пропускаем

			try {
				await sendDirectMessage(payload.chatId, payload.text);
			} catch (err) {
				// 403 (бот не запущен/заблокирован) или 400 (нет чата) — повторять бессмысленно
				if (err instanceof HTTPError && [400, 403].includes(err.response.status)) {
					throw new UnrecoverableError(`Telegram ${err.response.status}`);
				}
				throw err;
			}
		},
		{
			connection: bullConnection(),
			concurrency: 5,
			limiter: { max: 25, duration: 1000 } // под глобальный лимит Telegram
		}
	);

	worker.on('failed', (job, err) => {
		console.error(`[notify] задача ${job?.id} (${job?.name}) упала:`, err.message);
	});
}
