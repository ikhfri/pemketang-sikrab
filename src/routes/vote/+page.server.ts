import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

import { db } from '#lib/server/db.js';
import {
	candidates,
	users,
	votes,
	votingSettings
} from '#lib/server/db/schema.js';
import { deleteSession } from '#lib/server/auth/session.js';

const VOTING_SETTINGS_ID = 'voting-settings';

/**
 * =========================================================
 * LOAD
 * =========================================================
 */

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	/**
	 * Jangan redirect user berdasarkan hasVoted.
	 *
	 * User yang sudah vote tetap boleh membuka /vote.
	 * Frontend bisa menampilkan status bahwa mereka sudah vote.
	 */

	const candidateList = await db
		.select({
			id: candidates.id,

			ketuaName: candidates.ketuaName,
			ketuaPhotoUrl: candidates.ketuaPhotoUrl,

			wakilName: candidates.wakilName,
			wakilPhotoUrl: candidates.wakilPhotoUrl,

			vision: candidates.vision,
			mission: candidates.mission
		})
		.from(candidates);

	/**
	 * Ambil konfigurasi voting.
	 */

	const votingSettingsResult = await db
		.select({
			openAt: votingSettings.openAt,
			closeAt: votingSettings.closeAt
		})
		.from(votingSettings)
		.where(
			eq(
				votingSettings.id,
				VOTING_SETTINGS_ID
			)
		)
		.limit(1);

	const settings = votingSettingsResult[0] ?? null;

	/**
	 * Tentukan status voting.
	 */

	let votingStatus:
		| 'NOT_CONFIGURED'
		| 'UPCOMING'
		| 'OPEN'
		| 'CLOSED' = 'NOT_CONFIGURED';

	let isVotingOpen = false;

	if (settings) {
		const now = new Date();

		if (now < settings.openAt) {
			votingStatus = 'UPCOMING';
		} else if (
			now >= settings.openAt &&
			now < settings.closeAt
		) {
			votingStatus = 'OPEN';
			isVotingOpen = true;
		} else {
			votingStatus = 'CLOSED';
		}
	}

	return {
		user: locals.user,

		candidates: candidateList,

		voting: {
			isConfigured: Boolean(settings),

			isOpen: isVotingOpen,

			status: votingStatus,

			openAt: settings?.openAt ?? null,

			closeAt: settings?.closeAt ?? null
		}
	};
};

/**
 * =========================================================
 * ACTIONS
 * =========================================================
 */

export const actions: Actions = {
	vote: async ({ request, locals, cookies }) => {
		/**
		 * ===================================================
		 * 1. CEK SESSION
		 * ===================================================
		 */

		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const user = locals.user;

		/**
		 * ===================================================
		 * 2. CEK APAKAH SUDAH VOTE
		 * ===================================================
		 *
		 * Diletakkan sebelum pengecekan jadwal.
		 *
		 * Jadi kalau user sudah pernah vote,
		 * pesan yang muncul tetap ALREADY_VOTED.
		 */

		if (user.hasVoted) {
			return {
				success: false,
				code: 'ALREADY_VOTED',
				error: 'Lu kan dah nge-vote mpruy 😭'
			};
		}

		/**
		 * ===================================================
		 * 3. AMBIL CANDIDATE ID
		 * ===================================================
		 */

		const formData = await request.formData();

		const candidateId = formData.get(
			'candidateId'
		);

		if (
			typeof candidateId !== 'string' ||
			!candidateId.trim()
		) {
			return {
				success: false,
				code: 'INVALID_CANDIDATE',
				error:
					'Silakan pilih pasangan terlebih dahulu.'
			};
		}

		/**
		 * ===================================================
		 * 4. CEK CANDIDATE
		 * ===================================================
		 */

		const candidate = await db
			.select({
				id: candidates.id
			})
			.from(candidates)
			.where(
				eq(candidates.id, candidateId)
			)
			.limit(1);

		if (!candidate[0]) {
			return {
				success: false,
				code: 'CANDIDATE_NOT_FOUND',
				error:
					'Pasangan calon tidak ditemukan.'
			};
		}

		/**
		 * ===================================================
		 * 5. CEK JADWAL VOTING
		 * ===================================================
		 *
		 * Pengecekan awal untuk memberikan response cepat
		 * sebelum masuk transaction.
		 */

		const votingSettingsResult = await db
			.select({
				openAt: votingSettings.openAt,
				closeAt: votingSettings.closeAt
			})
			.from(votingSettings)
			.where(
				eq(
					votingSettings.id,
					VOTING_SETTINGS_ID
				)
			)
			.limit(1);

		const settings =
			votingSettingsResult[0];

		if (!settings) {
			return {
				success: false,
				code: 'VOTING_NOT_CONFIGURED',
				error:
					'Voting belum dikonfigurasi oleh admin.'
			};
		}

		const now = new Date();

		/**
		 * Belum masuk waktu voting.
		 */

		if (now < settings.openAt) {
			return {
				success: false,
				code: 'VOTING_NOT_OPEN',
				error:
					'Voting belum dibuka.'
			};
		}

		/**
		 * Sudah melewati waktu voting.
		 */

		if (now >= settings.closeAt) {
			return {
				success: false,
				code: 'VOTING_CLOSED',
				error:
					'Voting sudah ditutup.'
			};
		}

		/**
		 * ===================================================
		 * 6. TRANSACTION
		 * ===================================================
		 */

		try {
			await db.transaction(async (tx) => {
				/**
				 * =============================================
				 * CEK ULANG JADWAL
				 * =============================================
				 *
				 * Ini penting karena bisa saja admin mengubah
				 * jadwal ketika request sedang berjalan.
				 */

				const currentSettings =
					await tx
						.select({
							openAt:
								votingSettings.openAt,

							closeAt:
								votingSettings.closeAt
						})
						.from(votingSettings)
						.where(
							eq(
								votingSettings.id,
								VOTING_SETTINGS_ID
							)
						)
						.limit(1);

				if (!currentSettings[0]) {
					throw new Error(
						'VOTING_NOT_CONFIGURED'
					);
				}

				const currentTime =
					new Date();

				if (
					currentTime <
					currentSettings[0].openAt
				) {
					throw new Error(
						'VOTING_NOT_OPEN'
					);
				}

				if (
					currentTime >=
					currentSettings[0].closeAt
				) {
					throw new Error(
						'VOTING_CLOSED'
					);
				}

				/**
				 * =============================================
				 * CEK USER LANGSUNG KE DATABASE
				 * =============================================
				 *
				 * Jangan hanya mengandalkan locals.user.
				 *
				 * Ini melindungi dari dua request voting
				 * hampir bersamaan.
				 */

				const currentUser =
					await tx
						.select({
							hasVoted:
								users.hasVoted
						})
						.from(users)
						.where(
							eq(
								users.id,
								user.id
							)
						)
						.limit(1);

				if (!currentUser[0]) {
					throw new Error(
						'USER_NOT_FOUND'
					);
				}

				/**
				 * Proteksi double vote.
				 */

				if (
					currentUser[0].hasVoted
				) {
					throw new Error(
						'ALREADY_VOTED'
					);
				}

				/**
				 * =============================================
				 * INSERT VOTE
				 * =============================================
				 */

				await tx
					.insert(votes)
					.values({
						id: crypto.randomUUID(),

						userId: user.id,

						candidateId:
							candidate[0].id
					});

				/**
				 * =============================================
				 * UPDATE USER
				 * =============================================
				 */

				await tx
					.update(users)
					.set({
						hasVoted: true,

						updatedAt:
							new Date()
					})
					.where(
						eq(
							users.id,
							user.id
						)
					);
			});

			/**
			 * =================================================
			 * 7. VOTING BERHASIL
			 * =================================================
			 */

			/**
			 * Ambil session saat ini.
			 */

			const sessionId =
				cookies.get('session');

			/**
			 * Hapus session dari database.
			 */

			if (sessionId) {
				await deleteSession(
					sessionId
				);
			}

			/**
			 * Hapus cookie session.
			 */

			cookies.delete('session', {
				path: '/'
			});

			/**
			 * Redirect ke halaman terima kasih.
			 */

			throw redirect(
				303,
				'/thanks'
			);
		} catch (error) {
			/**
			 * =================================================
			 * REDIRECT SVELTEKIT
			 * =================================================
			 *
			 * Redirect bukan error biasa.
			 * Harus diteruskan.
			 */

			if (
				error &&
				typeof error === 'object' &&
				'status' in error
			) {
				throw error;
			}

			/**
			 * =================================================
			 * VOTING BELUM DIKONFIGURASI
			 * =================================================
			 */

			if (
				error instanceof Error &&
				error.message ===
					'VOTING_NOT_CONFIGURED'
			) {
				return {
					success: false,
					code:
						'VOTING_NOT_CONFIGURED',
					error:
						'Voting belum dikonfigurasi oleh admin.'
				};
			}

			/**
			 * =================================================
			 * VOTING BELUM DIBUKA
			 * =================================================
			 */

			if (
				error instanceof Error &&
				error.message ===
					'VOTING_NOT_OPEN'
			) {
				return {
					success: false,
					code: 'VOTING_NOT_OPEN',
					error:
						'Voting belum dibuka.'
				};
			}

			/**
			 * =================================================
			 * VOTING SUDAH DITUTUP
			 * =================================================
			 */

			if (
				error instanceof Error &&
				error.message ===
					'VOTING_CLOSED'
			) {
				return {
					success: false,
					code: 'VOTING_CLOSED',
					error:
						'Voting sudah ditutup.'
				};
			}

			/**
			 * =================================================
			 * USER SUDAH VOTE
			 * =================================================
			 */

			if (
				error instanceof Error &&
				error.message ===
					'ALREADY_VOTED'
			) {
				return {
					success: false,
					code: 'ALREADY_VOTED',
					error:
						'Lu kan dah nge-vote mpruy 😭'
				};
			}

			/**
			 * =================================================
			 * USER TIDAK DITEMUKAN
			 * =================================================
			 */

			if (
				error instanceof Error &&
				error.message ===
					'USER_NOT_FOUND'
			) {
				return {
					success: false,
					code: 'USER_NOT_FOUND',
					error:
						'User tidak ditemukan.'
				};
			}

			/**
			 * =================================================
			 * ERROR LAIN
			 * =================================================
			 */

			console.error(
				'POST /vote error:',
				error
			);

			return {
				success: false,
				code: 'VOTE_FAILED',
				error:
					'Suara gagal disimpan. Silakan coba lagi.'
			};
		}
	}
};