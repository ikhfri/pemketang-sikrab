import { getSessionUser } from '#lib/server/auth/session.js';
import type { RequestEvent } from '@sveltejs/kit';

export const handle = async ({
	event,
	resolve
}: {
	event: RequestEvent;
	resolve: (event: RequestEvent) => Promise<Response>;
}) => {
	const sessionId = event.cookies.get('session');

	if (sessionId) {
		const user = await getSessionUser(sessionId);

		if (user) {
			event.locals.user = user;
		} else {
			event.cookies.delete('session', { path: '/' });
		}
	}

	return resolve(event);
};