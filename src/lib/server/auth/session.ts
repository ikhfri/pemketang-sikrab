import { db } from '../db';
import { sessions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7;

function generateSessionId() {
	return crypto.randomUUID();
}

export async function createSession(userId: string) {
	const sessionId = generateSessionId();

	const expiresAt = new Date(Date.now() + SESSION_DURATION);

	await db.insert(sessions).values({
		id: sessionId,
		userId,
		expiresAt
	});

	return {
		id: sessionId,
		expiresAt
	};
}

export async function getSessionUser(sessionId: string) {
	const result = await db
		.select({
			id: users.id,
			nim: users.nim,
			name: users.name,
			role: users.role,
			hasVoted: users.hasVoted,
			expiresAt: sessions.expiresAt
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.limit(1);

	const session = result[0];

	if (!session) {
		return null;
	}

	if (session.expiresAt < new Date()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));

		return null;
	}

	return session;
}

export async function deleteSession(sessionId: string) {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}