import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.POSTGRES_DATABASE_URL ?? "postgres://alerts:alerts@localhost:5432/alerts_shelters",
  },
  // службові таблиці PostGIS (spatial_ref_sys тощо) не чіпаємо
  extensionsFilters: ["postgis"],
});
