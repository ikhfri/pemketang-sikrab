CREATE TYPE "public"."role" AS ENUM('VOTER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"ketua_name" text NOT NULL,
	"ketua_photo_url" text,
	"wakil_name" text NOT NULL,
	"wakil_photo_url" text,
	"vision" text,
	"mission" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"nim" text NOT NULL,
	"name" text NOT NULL,
	"kelompok" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'VOTER' NOT NULL,
	"has_voted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "one_vote_per_user" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "voting_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"open_at" timestamp NOT NULL,
	"close_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;