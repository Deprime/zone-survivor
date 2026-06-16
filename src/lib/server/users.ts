import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, type User } from './db/schema';
import { COOLDOWN_SECONDS } from '$lib/constants/game';

export function getUserById(id: number): Promise<User | undefined> {
	return db
		.select()
		.from(users)
		.where(eq(users.id, id))
		.limit(1)
		.then((rows) => rows[0]);
}

export function getUserByTelegramId(telegramId: number): Promise<User | undefined> {
	return db
		.select()
		.from(users)
		.where(eq(users.telegramId, telegramId))
		.limit(1)
		.then((rows) => rows[0]);
}

export function getUserByUuid(uuid: string): Promise<User | undefined> {
	return db
		.select()
		.from(users)
		.where(eq(users.uuid, uuid))
		.limit(1)
		.then((rows) => rows[0]);
}

export interface RegisterInput {
	telegramId: number;
	chatId: number;
	username: string | null;
	/** id пригласившего пользователя (реферал), либо null. */
	parentId: number | null;
}

/** Создаёт нового пользователя (uuid генерируется автоматически). */
export async function createUser(input: RegisterInput): Promise<User> {
	const nowSec = Math.floor(Date.now() / 1000);
	await db.insert(users).values({
		telegramId: input.telegramId,
		chatId: input.chatId,
		username: input.username,
		parentId: input.parentId,
		// Регистрация считается «нажатием» на величину кулдауна назад — кнопка доступна сразу.
		activeAt: nowSec - COOLDOWN_SECONDS
	});

	const created = await getUserByTelegramId(input.telegramId);
	if (!created) throw new Error('Не удалось создать пользователя');
	return created;
}
