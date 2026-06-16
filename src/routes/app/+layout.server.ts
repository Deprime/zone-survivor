import { redirect } from '@sveltejs/kit';
import { getUserById } from '$lib/server/users';
import type { LayoutServerLoad } from './$types';

// Гард раздела + всегда свежий пользователь (после действий вроде нажатия «Я жив»).
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const user = (await getUserById(locals.user.id)) ?? locals.user;
	return { user };
};
