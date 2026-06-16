import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { eventLog } from '$lib/server/db/schema';

export interface JournalEntry {
	type: string;
	message: string;
}

/** Пишет одно событие в журнал. Ошибки журнала не должны ломать игровую логику. */
export async function logEvent(userId: number, type: string, message: string): Promise<void> {
	await logEvents(userId, [{ type, message }]);
}

/** Пишет несколько событий одним запросом. */
export async function logEvents(userId: number, entries: JournalEntry[]): Promise<void> {
	if (entries.length === 0) return;
	try {
		await db
			.insert(eventLog)
			.values(entries.map((e) => ({ userId, type: e.type, message: e.message })));
	} catch (err) {
		console.error('[journal] не удалось записать событие:', err);
	}
}

/** Последние события пользователя (для страницы журнала). */
export function getRecentEvents(userId: number, limit = 50) {
	return db
		.select({ type: eventLog.type, message: eventLog.message, createdAt: eventLog.createdAt })
		.from(eventLog)
		.where(eq(eventLog.userId, userId))
		.orderBy(desc(eventLog.createdAt))
		.limit(limit);
}
