import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { inventoryItems } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const items = locals.user
		? await db.select().from(inventoryItems).where(eq(inventoryItems.userId, locals.user.id))
		: [];
	return { items };
};
