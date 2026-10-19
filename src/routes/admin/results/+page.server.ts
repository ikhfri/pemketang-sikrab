import { redirect } from '@sveltejs/kit';
import { desc, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

import { db } from '#lib/server/db.js';
import { candidates, votes } from '#lib/server/db/schema.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (locals.user.role !== 'ADMIN') {
		throw redirect(303, '/vote');
	}

	const results = await db
		.select({
			id: candidates.id,
			ketuaName: candidates.ketuaName,
			wakilName: candidates.wakilName,
			ketuaPhotoUrl: candidates.ketuaPhotoUrl,
			wakilPhotoUrl: candidates.wakilPhotoUrl,
			voteCount: sql<number>`count(${votes.id})::int`
		})
		.from(candidates)
		.leftJoin(
			votes,
			eq(votes.candidateId, candidates.id)
		)
		.groupBy(candidates.id)
		.orderBy(desc(sql`count(${votes.id})`));

	const totalVotesResult = await db
		.select({
			count: sql<number>`count(*)::int`
		})
		.from(votes);

	return {
		results,
		totalVotes: totalVotesResult[0]?.count ?? 0
	};
};