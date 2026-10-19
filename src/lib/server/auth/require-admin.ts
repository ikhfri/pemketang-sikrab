import { redirect } from '@sveltejs/kit';

export function requireAdmin(
	user: App.Locals['user']
) {
	if (!user) {
		throw redirect(303, '/login');
	}

	if (user.role !== 'ADMIN') {
		throw redirect(303, '/vote');
	}

	return user;
}