CREATE TABLE "artifact_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"artifact_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"invited_by_user_id" text
);
--> statement-breakpoint
ALTER TABLE "artifact_shares" ADD CONSTRAINT "artifact_shares_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_shares" ADD CONSTRAINT "artifact_shares_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "artifact_shares_artifact_email_unique" ON "artifact_shares" USING btree ("artifact_id","email");--> statement-breakpoint
CREATE INDEX "artifact_shares_email_idx" ON "artifact_shares" USING btree ("email");