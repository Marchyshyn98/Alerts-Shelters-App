import {
  AlertSchema,
  HealthSchema,
  NearbyShelterSchema,
  RegionSchema,
  ShelterSchema,
  StatsSummarySchema,
  type Health,
  type NearbySheltersQuery,
  type SheltersQuery,
} from "@alerts-shelters/shared";
import { z } from "zod";

const API_PREFIX = "/api";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** На сервері (SSR у Docker) API доступний за внутрішньою адресою, напр. http://api:4000 */
const baseUrl = () =>
  typeof window === "undefined" ? (process.env.API_INTERNAL_URL ?? API_URL) : API_URL;

async function get<T>(path: string, schema: z.ZodType<T>, params?: object): Promise<T> {
  const url = new URL(API_PREFIX + path, baseUrl());
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, { cache: "no-store" });
  // console.log(res);
  if (!res.ok) {
    console.log(res);
    const problem = await res.json().catch(() => null);
    throw new Error(problem?.detail ?? problem?.title ?? `API ${res.status}`);
  }
  return schema.parse(await res.json());
}

/** 503 — теж валідна відповідь health (status: "down"), тому не кидаємо помилку, як у get() */
async function getHealth(): Promise<Health> {
  const res = await fetch(new URL("/v1/health", baseUrl()), { cache: "no-store" });
  if (!res.ok && res.status !== 503) throw new Error(`API ${res.status}`);
  return HealthSchema.parse(await res.json());
}

export const api = {
  health: getHealth,
  activeAlerts: () => get("/alerts/active", z.array(AlertSchema)),
  regions: () => get("/regions", z.array(RegionSchema)),
  shelters: (q: Partial<SheltersQuery>) => get("/shelters", z.array(ShelterSchema), q),
  nearbyShelters: (q: Pick<NearbySheltersQuery, "lat" | "lon"> & Partial<NearbySheltersQuery>) =>
    get("/shelters/nearby", z.array(NearbyShelterSchema), q),
  stats: (days: number) => get("/stats/summary", StatsSummarySchema, { days }),
  alertsStreamUrl: () => new URL(API_PREFIX + "/alerts/stream", API_URL).toString(),
};
