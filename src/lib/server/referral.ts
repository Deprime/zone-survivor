import { and, count, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { users, inventoryItems } from './db/schema';
import { MAX_REFERRALS, TOKENS_PER_REFERRAL } from '$lib/constants/referral';
import { RESURRECTION_CROSS } from '$lib/constants/drop';

/**
 * Начисляет рефереру бонус за приглашённого пользователя:
 *  - +TOKENS_PER_REFERRAL токенов;
 *  - на MAX_REFERRALS-м реферале выдаёт «Крест воскрешения» (однократно).
 *
 * Вызывается после создания нового пользователя с заполненным parent_id.
 */
export async function applyReferralReward(parentId: number): Promise<void> {
	// +1 токен рефереру.
	await db
		.update(users)
		.set({ tokens: sql`${users.tokens} + ${TOKENS_PER_REFERRAL}` })
		.where(eq(users.id, parentId));

	// Сколько всего рефералов привёл этот пользователь.
	const [row] = await db
		.select({ value: count() })
		.from(users)
		.where(eq(users.parentId, parentId));
	const referralCount = Number(row?.value ?? 0);

	// Ровно на 10-м реферале — выдаём крест один раз.
	if (referralCount === MAX_REFERRALS) {
		const [existing] = await db
			.select({ id: inventoryItems.id })
			.from(inventoryItems)
			.where(
				and(eq(inventoryItems.userId, parentId), eq(inventoryItems.itemKey, RESURRECTION_CROSS))
			)
			.limit(1);

		if (!existing) {
			await db.insert(inventoryItems).values({
				userId: parentId,
				itemKey: RESURRECTION_CROSS
			});
		}
	}
}
