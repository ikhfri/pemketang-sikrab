import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['VOTER', 'ADMIN']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  nim: text('nim').notNull().unique(),
  name: text('name').notNull(),
  kelompok: text('kelompok').notNull(),
  password: text('password').notNull(),

  role: roleEnum('role').default('VOTER').notNull(),
  hasVoted: boolean('has_voted').default(false).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(),

  ketuaName: text('ketua_name').notNull(),
  ketuaPhotoUrl: text('ketua_photo_url'),

  wakilName: text('wakil_name').notNull(),
  wakilPhotoUrl: text('wakil_photo_url'),

  vision: text('vision'),
  mission: text('mission'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const votes = pgTable(
  'votes',
  {
    id: text('id').primaryKey(),

    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    candidateId: text('candidate_id')
      .notNull()
      .references(() => candidates.id),

    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => ({
    oneVotePerUser: unique('one_vote_per_user').on(table.userId)
  })
);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade'
    }),

  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const votingSettings = pgTable('voting_settings', {
  id: text('id').primaryKey(),

  openAt: timestamp('open_at').notNull(),
  closeAt: timestamp('close_at').notNull(),

  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
});
