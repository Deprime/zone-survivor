import { eq } from 'drizzle-orm';
import { PUBLIC_SITE_URL } from '$env/static/public';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { redis } from '$lib/server/redis';
import { getUserByTelegramId } from '$lib/server/users';
import { sendDirectMessage } from '$lib/server/telegram';

interface TgUser {
	id: number;
}
interface TgChat {
	id: number;
}
interface TgMessage {
	from?: TgUser;
	chat?: TgChat;
	text?: string;
}
export interface TelegramUpdate {
	message?: TgMessage;
}

const siteBase = () => (PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

/** Ключ Redis для реферала, пришедшего через бот-ссылку (до регистрации на сайте). */
export const pendingRefKey = (telegramId: number) => `pendingref:${telegramId}`;

/** Точка входа: обрабатывает апдейт Telegram (пока — только команда /start). */
export async function handleUpdate(update: TelegramUpdate): Promise<void> {
	const msg = update.message;
	if (!msg?.text) return;

	const text = msg.text.trim();
	if (text === '/start' || text.startsWith('/start ')) {
		await handleStart(msg, text);
	}
}

async function handleStart(msg: TgMessage, text: string): Promise<void> {
	const telegramId = msg.from?.id;
	const chatId = msg.chat?.id;
	if (!telegramId || !chatId) return;

	// Реферал из deep-link: t.me/<bot>?start=ref_<uuid> (или просто <uuid>).
	const payload = text.split(' ').slice(1).join(' ').trim();
	const refUuid = payload.startsWith('ref_')
		? payload.slice(4)
		: payload.length === 36
			? payload
			: '';

	const user = await getUserByTelegramId(telegramId);

	if (user) {
		// Уже зарегистрирован — фиксируем актуальный chat_id и включаем уведомления.
		if (user.chatId !== chatId) {
			await db.update(users).set({ chatId }).where(eq(users.id, user.id));
		}
		await sendDirectMessage(
			chatId,
			`🧟 <b>Уведомления включены!</b> Напишу про укусы зомби, гибель и когда снова можно нажать «Я жив».\n\nИграть: ${siteBase()}/app/game`
		);
		return;
	}

	// Ещё не зарегистрирован — запомним реферала до входа на сайте.
	if (refUuid) {
		try {
			await redis.set(pendingRefKey(telegramId), refUuid, 'EX', 7 * 24 * 60 * 60);
		} catch {
			/* некритично */
		}
	}
	await sendDirectMessage(
		chatId,
		`👋 Привет! Сначала войди на сайте через Telegram, потом вернись — и я буду слать тебе уведомления.\n\nВойти: ${siteBase()}/login`
	);
}
