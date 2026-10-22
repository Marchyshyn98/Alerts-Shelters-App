import { z } from "zod";

export const StatsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(7),
});

export const StatsSummarySchema = z.object({
  days: z.number().int(),
  activeAlerts: z.number().int(),
  byRegion: z.array(
    z.object({
      regionId: z.string(),
      regionName: z.string(),
      alerts: z.number().int(),
      totalMinutes: z.number(),
      averageMinutes: z.number()
    }),
  ),
  sheltersByCity: z.array(
    z.object({
      city: z.string().nullable(),
      shelters: z.number().int()
    }),
  ),
});
