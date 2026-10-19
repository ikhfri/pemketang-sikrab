import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

import { deleteSession } from '#lib/server/auth/session.js';

export const POST = async ({ cookies }: RequestEvent) => {
	const sessionId = cookies.get('session');

	if (sessionId) {
		await deleteSession(sessionId);
	}

	cookies.delete('session', {
		path: '/'
	});

	throw redirect(303, '/login');
};