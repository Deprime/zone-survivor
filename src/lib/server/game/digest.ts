import { desc, eq, gte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { graves, users } from '$lib/server/db/schema';
import { DEATH_DIGEST_MAX_ENTRIES } from '$lib/constants/game';
import { escapeHtml, sendChannelMessage } from '$lib/server/telegram';

/**
 * Собирает текст дайджеста павших за последние сутки (имя + эпитафия).
 * Возвращает null, если потерь нет.
 */
export async function buildDeathDigest(): Promise<{ text: string; count: number } | null> {
	const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

	const rows = await db
		.select({
			userId: users.id,
			name: users.username,
			inscription: graves.inscription
		})
		.from(graves)
		.innerJoin(users, eq(graves.userId, users.id))
		.where(gte(graves.createdAt, cutoff))
		.orderBy(desc(graves.createdAt))
		.limit(500);

	if (rows.length === 0) return null;

	const shown = rows.slice(0, DEATH_DIGEST_MAX_ENTRIES);
	const lines = shown.map((r) => {
		const name = escapeHtml(r.name ?? `Выживший #${r.userId}`);
		const epitaph = r.inscription
			? `«${escapeHtml(r.inscription)}»`
			: '<i>без эпитафии</i>';
		return `🪦 <b>${name}</b> — ${epitaph}`;
	});

	const header = `☠️ <b>Павшие за сутки: ${rows.length}</b>`;
	let body = lines.join('\n');
	if (rows.length > shown.length) {
		body += `\n…и ещё ${rows.length - shown.length}`;
	}

	return { text: `${header}\n\n${body}`, count: rows.length };
}

/** Собирает и отправляет дайджест в канал. */
export async function sendDeathDigest(): Promise<{ sent: boolean; count: number }> {
	const digest = await buildDeathDigest();
	if (!digest) return { sent: false, count: 0 };

	await sendChannelMessage(digest.text);
	return { sent: true, count: digest.count };
}
