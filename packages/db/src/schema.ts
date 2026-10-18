import { sql } from "drizzle-orm";
import {
  geometry,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const regions = pgTable("regions", {
  /** UID регіону з alerts.in.ua */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["oblast", "raion", "hromada", "city"] }).notNull(),
  parentId: text("parent_id"),
});

export const alerts = pgTable(
  "alerts",
  {
    id: serial("id").primaryKey(),
    regionId: text("region_id")
      .notNull()
      .references(() => regions.id),
    type: text("type", {
      enum: ["air_raid", "artillery_shelling", "urban_fights", "chemical", "nuclear"],
    }).notNull(),
    source: text("source", { enum: ["alerts-in-ua", "neptun"] }).notNull(),
    externalId: text("external_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("alerts_source_external_id_uq").on(t.source, t.externalId),
    index("alerts_region_started_idx").on(t.regionId, t.startedAt),
    index("alerts_active_idx").on(t.regionId).where(sql`${t.endedAt} is null`),
  ],
);

export const shelters = pgTable(
  "shelters",
  {
    id: serial("id").primaryKey(),
    /** звідки імпортовано: lviv, ivano-frankivsk, ... */
    source: text("source").notNull(),
    /** id у джерелі або хеш адреси, якщо id немає */
    externalId: text("external_id").notNull(),
    type: text("type").notNull(),
    address: text("address").notNull(),
    city: text("city"),
    district: text("district"),
    community: text("community"),
    capacity: integer("capacity"),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
    raw: jsonb("raw").notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("shelters_source_external_id_uq").on(t.source, t.externalId),
    index("shelters_location_gist").using("gist", t.location),
    index("shelters_city_idx").on(t.city),
  ],
);
