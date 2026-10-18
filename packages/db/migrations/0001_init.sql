CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" text NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"parent_id" text
);
--> statement-breakpoint
CREATE TABLE "shelters" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"type" text NOT NULL,
	"address" text NOT NULL,
	"city" text,
	"district" text,
	"community" text,
	"capacity" integer,
	"location" geometry(point, 4326),
	"raw" jsonb NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_source_external_id_uq" ON "alerts" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "alerts_region_started_idx" ON "alerts" USING btree ("region_id","started_at");--> statement-breakpoint
CREATE INDEX "alerts_active_idx" ON "alerts" USING btree ("region_id") WHERE "alerts"."ended_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "shelters_source_external_id_uq" ON "shelters" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "shelters_location_gist" ON "shelters" USING gist ("location");--> statement-breakpoint
CREATE INDEX "shelters_city_idx" ON "shelters" USING btree ("city");