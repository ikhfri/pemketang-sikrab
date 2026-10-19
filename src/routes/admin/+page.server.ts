import { fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

import { db } from '#lib/server/db.js';
import {
  candidates,
  users,
  votes,
  votingSettings
} from '#lib/server/db/schema.js';

const VOTING_SETTINGS_ID = 'voting-settings';

function requireAdmin(locals: App.Locals) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  if (locals.user.role !== 'ADMIN') {
    throw redirect(303, '/vote');
  }

  return locals.user;
}

/** Parse nilai datetime-local sebagai waktu WIB (UTC+7). */
function parseWibDate(value: string) {
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Konversi tanggal UTC ke format yang dapat dipakai datetime-local dalam WIB. */
function formatDateTimeLocal(date: Date | null) {
  if (!date) return '';

  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wibDate.toISOString().slice(0, 16);
}

function getVotingStatus(settings: { openAt: Date; closeAt: Date } | null) {
  if (!settings) {
    return {
      status: 'NOT_CONFIGURED' as const,
      isConfigured: false,
      isOpen: false
    };
  }

  const now = new Date();

  if (now < settings.openAt) {
    return {
      status: 'UPCOMING' as const,
      isConfigured: true,
      isOpen: false
    };
  }

  if (now >= settings.openAt && now < settings.closeAt) {
    return {
      status: 'OPEN' as const,
      isConfigured: true,
      isOpen: true
    };
  }

  return {
    status: 'CLOSED' as const,
    isConfigured: true,
    isOpen: false
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  const [
    candidateResults,
    totalVotersResult,
    totalVotesResult,
    votingSettingsResult,
    voterResults
  ] = await Promise.all([
    db
      .select({
        id: candidates.id,
        ketuaName: candidates.ketuaName,
        ketuaPhotoUrl: candidates.ketuaPhotoUrl,
        wakilName: candidates.wakilName,
        wakilPhotoUrl: candidates.wakilPhotoUrl,
        vision: candidates.vision,
        mission: candidates.mission
      })
      .from(candidates)
      .orderBy(candidates.createdAt),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'VOTER')),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(votes),

    db
      .select({
        id: votingSettings.id,
        openAt: votingSettings.openAt,
        closeAt: votingSettings.closeAt,
        updatedAt: votingSettings.updatedAt
      })
      .from(votingSettings)
      .where(eq(votingSettings.id, VOTING_SETTINGS_ID))
      .limit(1),

    // Status pemilih diambil dari users.hasVoted sesuai schema.
    // Ini juga mempertahankan pemilih yang belum memberikan suara.
    db
      .select({
        id: users.id,
        nim: users.nim,
        name: users.name,
        kelompok: users.kelompok,
        hasVoted: users.hasVoted
      })
      .from(users)
      .where(eq(users.role, 'VOTER'))
      .orderBy(users.name)
  ]);

  const settings = votingSettingsResult[0] ?? null;
  const votingStatus = getVotingStatus(settings);
  const totalVoters = totalVotersResult[0]?.count ?? 0;
  const totalVotes = totalVotesResult[0]?.count ?? 0;
  const votedCount = voterResults.filter((voter) => voter.hasVoted).length;
  const notVotedCount = Math.max(totalVoters - votedCount, 0);

  return {
    user: locals.user,
    candidates: candidateResults,
    totalVoters,
    totalVotes,
    votedCount,
    notVotedCount,
    voters: voterResults,
    voting: {
      isConfigured: votingStatus.isConfigured,
      isOpen: votingStatus.isOpen,
      status: votingStatus.status,
      openAt: settings?.openAt ?? null,
      closeAt: settings?.closeAt ?? null,
      openAtInput: formatDateTimeLocal(settings?.openAt ?? null),
      closeAtInput: formatDateTimeLocal(settings?.closeAt ?? null)
    }
  };
};

export const actions: Actions = {
  updateVoting: async ({ request, locals }) => {
    requireAdmin(locals);

    const formData = await request.formData();
    const openAtRaw = formData.get('openAt')?.toString().trim();
    const closeAtRaw = formData.get('closeAt')?.toString().trim();

    if (!openAtRaw || !closeAtRaw) {
      return fail(400, {
        action: 'updateVoting',
        error: 'Waktu buka dan waktu tutup voting wajib diisi.'
      });
    }

    const openAt = parseWibDate(openAtRaw);
    const closeAt = parseWibDate(closeAtRaw);

    if (!openAt || !closeAt) {
      return fail(400, {
        action: 'updateVoting',
        error: 'Format waktu voting tidak valid.'
      });
    }

    if (closeAt <= openAt) {
      return fail(400, {
        action: 'updateVoting',
        error: 'Waktu tutup voting harus setelah waktu buka voting.'
      });
    }

    await db
      .insert(votingSettings)
      .values({
        id: VOTING_SETTINGS_ID,
        openAt,
        closeAt,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: votingSettings.id,
        set: {
          openAt,
          closeAt,
          updatedAt: new Date()
        }
      });

    return {
      success: true,
      action: 'updateVoting',
      message: 'Jadwal voting berhasil diperbarui.'
    };
  },

  createCandidate: async ({ request, locals }) => {
    requireAdmin(locals);

    const formData = await request.formData();
    const ketuaName = formData.get('ketuaName')?.toString().trim();
    const ketuaPhotoUrl = formData.get('ketuaPhotoUrl')?.toString().trim();
    const wakilName = formData.get('wakilName')?.toString().trim();
    const wakilPhotoUrl = formData.get('wakilPhotoUrl')?.toString().trim();
    const vision = formData.get('vision')?.toString().trim();
    const mission = formData.get('mission')?.toString().trim();

    if (!ketuaName) {
      return fail(400, {
        action: 'create',
        error: 'Nama Ketua wajib diisi.'
      });
    }

    if (!wakilName) {
      return fail(400, {
        action: 'create',
        error: 'Nama Wakil wajib diisi.'
      });
    }

    await db.insert(candidates).values({
      id: crypto.randomUUID(),
      ketuaName,
      ketuaPhotoUrl: ketuaPhotoUrl || null,
      wakilName,
      wakilPhotoUrl: wakilPhotoUrl || null,
      vision: vision || null,
      mission: mission || null
    });

    return {
      success: true,
      action: 'create',
      message: 'Pasangan calon berhasil ditambahkan.'
    };
  },

  updateCandidate: async ({ request, locals }) => {
    requireAdmin(locals);

    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const ketuaName = formData.get('ketuaName')?.toString().trim();
    const ketuaPhotoUrl = formData.get('ketuaPhotoUrl')?.toString().trim();
    const wakilName = formData.get('wakilName')?.toString().trim();
    const wakilPhotoUrl = formData.get('wakilPhotoUrl')?.toString().trim();
    const vision = formData.get('vision')?.toString().trim();
    const mission = formData.get('mission')?.toString().trim();

    if (!id) {
      return fail(400, {
        action: 'update',
        error: 'ID pasangan tidak ditemukan.'
      });
    }

    if (!ketuaName) {
      return fail(400, {
        action: 'update',
        error: 'Nama Ketua wajib diisi.'
      });
    }

    if (!wakilName) {
      return fail(400, {
        action: 'update',
        error: 'Nama Wakil wajib diisi.'
      });
    }

    const existingCandidate = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1);

    if (!existingCandidate[0]) {
      return fail(404, {
        action: 'update',
        error: 'Pasangan calon tidak ditemukan.'
      });
    }

    await db
      .update(candidates)
      .set({
        ketuaName,
        ketuaPhotoUrl: ketuaPhotoUrl || null,
        wakilName,
        wakilPhotoUrl: wakilPhotoUrl || null,
        vision: vision || null,
        mission: mission || null,
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id));

    return {
      success: true,
      action: 'update',
      message: 'Pasangan calon berhasil diperbarui.'
    };
  },

  deleteCandidate: async ({ request, locals }) => {
    requireAdmin(locals);

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return fail(400, {
        action: 'delete',
        error: 'ID pasangan tidak ditemukan.'
      });
    }

    const existingCandidate = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1);

    if (!existingCandidate[0]) {
      return fail(404, {
        action: 'delete',
        error: 'Pasangan calon tidak ditemukan.'
      });
    }

    const existingVotes = await db
      .select({ id: votes.id })
      .from(votes)
      .where(eq(votes.candidateId, id))
      .limit(1);

    if (existingVotes[0]) {
      return fail(400, {
        action: 'delete',
        error: 'Pasangan yang sudah memiliki suara tidak dapat dihapus.'
      });
    }

    await db.delete(candidates).where(eq(candidates.id, id));

    return {
      success: true,
      action: 'delete',
      message: 'Pasangan calon berhasil dihapus.'
    };
  }
};
