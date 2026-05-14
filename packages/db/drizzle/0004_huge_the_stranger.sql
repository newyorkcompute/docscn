CREATE TABLE "cli_device_logins" (
	"id" text PRIMARY KEY NOT NULL,
	"device_code_hash" text NOT NULL,
	"user_code" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_user_id" text,
	"approved_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "cli_device_logins_device_code_hash_unique" UNIQUE("device_code_hash"),
	CONSTRAINT "cli_device_logins_user_code_unique" UNIQUE("user_code")
);
--> statement-breakpoint
ALTER TABLE "cli_device_logins" ADD CONSTRAINT "cli_device_logins_approved_user_id_user_id_fk" FOREIGN KEY ("approved_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;