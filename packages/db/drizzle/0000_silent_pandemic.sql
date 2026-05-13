CREATE TABLE "artifact_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"artifact_id" text NOT NULL,
	"version" integer NOT NULL,
	"summary" text NOT NULL,
	"html" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"author" jsonb NOT NULL,
	"change_request_ids" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"author" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"visibility" text NOT NULL,
	"kind" text NOT NULL,
	"tags" jsonb NOT NULL,
	"source" text NOT NULL,
	"current_revision_id" text NOT NULL,
	CONSTRAINT "artifacts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"body" text NOT NULL,
	"author" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"artifact_id" text NOT NULL,
	"revision_id" text NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"anchor" jsonb,
	"requested_change" text
);
--> statement-breakpoint
ALTER TABLE "artifact_revisions" ADD CONSTRAINT "artifact_revisions_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_thread_id_review_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."review_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_threads" ADD CONSTRAINT "review_threads_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_threads" ADD CONSTRAINT "review_threads_revision_id_artifact_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."artifact_revisions"("id") ON DELETE cascade ON UPDATE no action;