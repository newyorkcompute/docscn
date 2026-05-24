ALTER TABLE "artifact_claims" ADD COLUMN "expires_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "artifact_claims" SET "expires_at" = "created_at" + INTERVAL '90 days';
--> statement-breakpoint
ALTER TABLE "artifact_claims" ALTER COLUMN "expires_at" SET NOT NULL;