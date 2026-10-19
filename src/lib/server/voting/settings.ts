import { eq } from 'drizzle-orm';

import { db } from '#lib/server/db.js';
import {
	votingSettings
} from '#lib/server/db/schema.js';

const VOTING_SETTINGS_ID =
	'voting-settings';

export async function getVotingSettings() {
	const result = await db
		.select({
			id: votingSettings.id,
			openAt: votingSettings.openAt,
			closeAt: votingSettings.closeAt,
			updatedAt:
				votingSettings.updatedAt
		})
		.from(votingSettings)
		.where(
			eq(
				votingSettings.id,
				VOTING_SETTINGS_ID
			)
		)
		.limit(1);

	return result[0] ?? null;
}

export async function getVotingStatus() {
	const settings =
		await getVotingSettings();

	if (!settings) {
		return {
			isConfigured: false,
			isOpen: false,
			status: 'NOT_CONFIGURED' as const,
			openAt: null,
			closeAt: null
		};
	}

	const now = new Date();

	if (now < settings.openAt) {
		return {
			isConfigured: true,
			isOpen: false,
			status: 'UPCOMING' as const,
			openAt: settings.openAt,
			closeAt: settings.closeAt
		};
	}

	if (
		now >= settings.openAt &&
		now < settings.closeAt
	) {
		return {
			isConfigured: true,
			isOpen: true,
			status: 'OPEN' as const,
			openAt: settings.openAt,
			closeAt: settings.closeAt
		};
	}

	return {
		isConfigured: true,
		isOpen: false,
		status: 'CLOSED' as const,
		openAt: settings.openAt,
		closeAt: settings.closeAt
	};
}