import type { LayoutServerLoad } from './$types';

// Прокидываем текущего пользователя во все layout/страницы.
export const load: LayoutServerLoad = ({ locals }) => ({
	user: locals.user ?? null
});
