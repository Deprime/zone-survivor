import { and, isNull, lt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { LIFESPAN_SECONDS } from '$lib/constants/game';
import { killUser } from './alive';

/**
 * Помечает погибшими всех, кто не нажимал «Я жив» дольше 24 часов,
 * и ставит надгробия. Идемпотентно (killUser сам проверяет died_at).
 * @returns число только что зафиксированных смертей.
 */
export async function sweepDeaths(): Promise<number> {
	const now = Math.floor(Date.now() / 1000);

	const candidates = await db
		.select({
			id: users.id,
			posX: users.posX,
			posY: users.posY,
			tokens: users.tokens,
			chatId: users.chatId,
			activeAt: users.activeAt
		})
		.from(users)
		.where(and(isNull(users.diedAt), lt(users.activeAt, now - LIFESPAN_SECONDS)));

	let dead = 0;
	for (const c of candidates) {
		const killed = await killUser(c, c.activeAt + LIFESPAN_SECONDS);
		if (killed) dead++;
	}
	return dead;
}
