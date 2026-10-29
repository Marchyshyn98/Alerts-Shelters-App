import { z } from "zod";

/** ok — дані свіжі; degraded — тривоги давно не оновлювались; down — БД не відповідає */
export const HealthStatusSchema = z.enum(["ok", "degraded", "down"]);

export const HealthSchema = z.object({
  status: HealthStatusSchema,
  database: z.enum(["ok", "down"]),
  sources: z.object({
    alerts: z.object({
      lastSuccess: z.coerce.date().nullable(),
      ageSeconds: z.number().int().nullable(),
    }),
    shelters: z.object({
      lastSuccess: z.coerce.date().nullable(),
    }),
  }),
});
