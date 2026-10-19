import 'dotenv/config';
import argon2 from 'argon2';
import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import {
  candidates,
  users,
  votes
} from '../src/lib/server/db/schema';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL belum diatur di file .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool);

async function seed() {
  console.log('🌱 Memulai seed...\n');

  const adminPassword = await argon2.hash('admin123');
  const voterPassword = await argon2.hash('123456');

  const candidate01Id = 'candidate-01';
  const candidate02Id = 'candidate-02';

  // Pastikan kelompok tersedia karena kolom ini NOT NULL di schema.
  const userData = [
    {
      id: 'user-admin',
      nim: 'ADMIN001',
      name: 'Administrator',
      kelompok: 'ADMIN',
      password: adminPassword,
      role: 'ADMIN' as const,
      hasVoted: false
    },
    {
      id: 'user-001',
      nim: '20260001',
      name: 'Ikhsan Fahri',
      kelompok: '1',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: true
    },
    {
      id: 'user-002',
      nim: '20260002',
      name: 'Rizky Maulana',
      kelompok: '1',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: true
    },
    {
      id: 'user-003',
      nim: '20260003',
      name: 'Fajar Ramadhan',
      kelompok: '1',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: true
    },
    {
      id: 'user-004',
      nim: '20260004',
      name: 'Rafi Pratama',
      kelompok: '2',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: true
    },
    {
      id: 'user-005',
      nim: '20260005',
      name: 'Andika Saputra',
      kelompok: '2',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: true
    },
    {
      id: 'user-006',
      nim: '20260006',
      name: 'Dimas Arya',
      kelompok: '2',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: false
    },
    {
      id: 'user-007',
      nim: '20260007',
      name: 'Bagas Firmansyah',
      kelompok: '3',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: false
    },
    {
      id: 'user-008',
      nim: '20260008',
      name: 'Raka Alfarizi',
      kelompok: '3',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: false
    },
    {
      id: 'user-009',
      nim: '20260009',
      name: 'Ilham Fauzi',
      kelompok: '3',
      password: voterPassword,
      role: 'VOTER' as const,
      hasVoted: false
    }
  ];

  await db.insert(users).values(userData).onConflictDoNothing();
  console.log('✅ 10 users dibuat/dilewati.');

  await db
    .insert(candidates)
    .values([
      {
        id: candidate01Id,
        ketuaName: 'Ahmad Fauzan',
        ketuaPhotoUrl: null,
        wakilName: 'Budi Santoso',
        wakilPhotoUrl: null,
        vision: 'Membangun angkatan yang solid, aktif, dan saling mendukung.',
        mission:
          'Meningkatkan komunikasi, kebersamaan, serta kegiatan positif antar anggota angkatan.'
      },
      {
        id: candidate02Id,
        ketuaName: 'Citra Lestari',
        ketuaPhotoUrl: null,
        wakilName: 'Dimas Pratama',
        wakilPhotoUrl: null,
        vision: 'Mewujudkan angkatan yang inovatif, kompak, dan berprestasi.',
        mission:
          'Mendorong kolaborasi dalam kegiatan akademik maupun non-akademik.'
      }
    ])
    .onConflictDoNothing();

  console.log('✅ 2 pasangan calon dibuat/dilewati.');

  // Data suara contoh: 3 suara untuk kandidat 01 dan 2 suara untuk kandidat 02.
  // Unique constraint pada votes.userId menjaga satu suara per pengguna.
  await db
    .insert(votes)
    .values([
      { id: 'vote-001', userId: 'user-001', candidateId: candidate01Id },
      { id: 'vote-002', userId: 'user-002', candidateId: candidate01Id },
      { id: 'vote-003', userId: 'user-003', candidateId: candidate01Id },
      { id: 'vote-004', userId: 'user-004', candidateId: candidate02Id },
      { id: 'vote-005', userId: 'user-005', candidateId: candidate02Id }
    ])
    .onConflictDoNothing();

  // Sinkronkan flag hasVoted dengan tabel votes.
  // Seed ini memakai data demo tetap, sehingga user-001 sampai user-005
  // ditandai sudah memilih dan user-006 sampai user-009 belum memilih.
  await db
    .update(users)
    .set({ hasVoted: true, updatedAt: new Date() })
    .where(
      // IDs ini adalah pengguna demo yang memiliki vote pada seed di atas.
      // Gunakan SQL helper agar update tetap eksplisit dan aman.
      inArray(users.id, [
        'user-001',
        'user-002',
        'user-003',
        'user-004',
        'user-005'
      ])
    );

  await db
    .update(users)
    .set({ hasVoted: false, updatedAt: new Date() })
    .where(
      inArray(users.id, [
        'user-006',
        'user-007',
        'user-008',
        'user-009'
      ])
    );
  console.log('✅ 5 votes dibuat/dilewati.');

  console.log('\n========================================');
  console.log('              SEED SELESAI');
  console.log('========================================\n');

  console.log('ADMIN');
  console.log('NIM      : ADMIN001');
  console.log('Password : admin123');

  console.log('\nVOTER SUDAH VOTING');
  console.log('----------------------------------------');
  console.log('20260001 - Ikhsan Fahri');
  console.log('20260002 - Rizky Maulana');
  console.log('20260003 - Fajar Ramadhan');
  console.log('20260004 - Rafi Pratama');
  console.log('20260005 - Andika Saputra');
  console.log('Password : 123456');

  console.log('\nVOTER BELUM VOTING');
  console.log('----------------------------------------');
  console.log('20260006 - Dimas Arya');
  console.log('20260007 - Bagas Firmansyah');
  console.log('20260008 - Raka Alfarizi');
  console.log('20260009 - Ilham Fauzi');
  console.log('Password : 123456');

  console.log('\nPASANGAN CALON');
  console.log('----------------------------------------');
  console.log('1. Ahmad Fauzan & Budi Santoso');
  console.log('   Suara: 3');
  console.log('2. Citra Lestari & Dimas Pratama');
  console.log('   Suara: 2');

  console.log('\nSTATISTIK');
  console.log('----------------------------------------');
  console.log('Total pemilih : 9');
  console.log('Sudah voting  : 5');
  console.log('Belum voting  : 4');
  console.log('Total suara   : 5');
  console.log('\n========================================\n');
}

seed()
  .catch((error) => {
    console.error('❌ Seed gagal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
