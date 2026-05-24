CREATE TABLE "artifact_claims" (
	"artifact_id" text PRIMARY KEY NOT NULL,
	"claim_token_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone,
	CONSTRAINT "artifact_claims_claim_token_hash_unique" UNIQUE("claim_token_hash")
);
--> statement-breakpoint
ALTER TABLE "artifact_claims" ADD CONSTRAINT "artifact_claims_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;