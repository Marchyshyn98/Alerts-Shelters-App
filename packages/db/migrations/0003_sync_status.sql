CREATE TABLE "sync_status" (
	"source" text PRIMARY KEY NOT NULL,
	"last_success" timestamp with time zone,
	"last_attempt" timestamp with time zone,
	"last_error" text
);
