import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(url = process.env.POSTGRES_DATABASE_URL) {
  if (!url) throw new Error("POSTGRES_DATABASE_URL is not set");
  return drizzle(postgres(url, { max: 10 }), { schema });
}

export type Db = ReturnType<typeof createDb>;
