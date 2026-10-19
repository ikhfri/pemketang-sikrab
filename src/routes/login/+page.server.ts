import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import type { RequestEvent } from '@sveltejs/kit';

import { db } from '#lib/server/db.js';
import { users } from '#lib/server/db/schema.js';
import { verifyPassword } from '#lib/server/auth/password.js';
import { createSession } from '#lib/server/auth/session.js';

export const actions: Actions = {
	default: async ({ request, cookies }: RequestEvent) => {


		const data = await request.formData();

		const nim = data.get('nim')?.toString().trim();
		const password = data.get('password')?.toString();

	

		if (!nim || !password) {
			return fail(400, {
				error: 'NIM dan password wajib diisi.',
				nim
			});
		}


		const result = await db
			.select()
			.from(users)
			.where(eq(users.nim, nim))
			.limit(1);

		const user = result[0];

		if (!user) {
			return fail(401, {
				error: 'NIM atau password salah.',
				nim
			});
		}


		const validPassword = await verifyPassword(
			user.password,
			password
		);

		if (!validPassword) {
			return fail(401, {
				error: 'NIM atau password salah.',
				nim
			});
		}


		const session = await createSession(user.id);



		cookies.set('session', session.id, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			expires: session.expiresAt
		});


		if (user.role === 'ADMIN') {
			throw redirect(303, '/admin');
		}
		throw redirect(303, '/vote');
	}
};