DO $$ BEGIN
 CREATE TYPE "jobtype" AS ENUM('full-time', 'part-time');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corpinfo" (
	"corpname" text NOT NULL,
	"corpid" text PRIMARY KEY NOT NULL,
	"logo" text NOT NULL,
	"brief" text NOT NULL,
	"chiefhr" text NOT NULL,
	"valid" boolean DEFAULT false NOT NULL,
	CONSTRAINT "corpinfo_logo_unique" UNIQUE("logo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hrinfo" (
	"name" text NOT NULL,
	"hrid" text NOT NULL,
	"corpid" text NOT NULL,
	"avatar" text NOT NULL,
	"phone" text NOT NULL,
	"uuid" uuid PRIMARY KEY NOT NULL,
	CONSTRAINT "hrinfo_avatar_unique" UNIQUE("avatar"),
	CONSTRAINT "hrinfo_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "infobox" (
	"uuid" uuid PRIMARY KEY NOT NULL,
	"info" text NOT NULL,
	"time" timestamp DEFAULT now() NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"no" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobinfo" (
	"position" text NOT NULL,
	"type" "jobtype" NOT NULL,
	"salary" "numrange" NOT NULL,
	"overview" text NOT NULL,
	"location" text NOT NULL,
	"corpid" text NOT NULL,
	"no" serial NOT NULL,
	"cvlist" text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userinfo" (
	"name" text NOT NULL,
	"id" text NOT NULL,
	"avatar" text NOT NULL,
	"phone" text NOT NULL,
	"location" text NOT NULL,
	"cv" text DEFAULT '' NOT NULL,
	"valid" boolean DEFAULT false NOT NULL,
	"uuid" uuid PRIMARY KEY NOT NULL,
	CONSTRAINT "userinfo_id_unique" UNIQUE("id"),
	CONSTRAINT "userinfo_avatar_unique" UNIQUE("avatar"),
	CONSTRAINT "userinfo_phone_unique" UNIQUE("phone"),
	CONSTRAINT "userinfo_location_unique" UNIQUE("location"),
	CONSTRAINT "userinfo_cv_unique" UNIQUE("cv")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"email" text NOT NULL,
	"password" text NOT NULL,
	"hr" boolean NOT NULL,
	"uuid" uuid PRIMARY KEY NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hrinfo" ADD CONSTRAINT "hrinfo_corpid_corpinfo_corpid_fk" FOREIGN KEY ("corpid") REFERENCES "corpinfo"("corpid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hrinfo" ADD CONSTRAINT "hrinfo_uuid_users_uuid_fk" FOREIGN KEY ("uuid") REFERENCES "users"("uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "infobox" ADD CONSTRAINT "infobox_uuid_users_uuid_fk" FOREIGN KEY ("uuid") REFERENCES "users"("uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobinfo" ADD CONSTRAINT "jobinfo_corpid_corpinfo_corpid_fk" FOREIGN KEY ("corpid") REFERENCES "corpinfo"("corpid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userinfo" ADD CONSTRAINT "userinfo_uuid_users_uuid_fk" FOREIGN KEY ("uuid") REFERENCES "users"("uuid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
