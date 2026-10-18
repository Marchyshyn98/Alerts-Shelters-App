import { z } from "zod";
import { RegionTypeSchema } from "./region";

export const AlertTypeSchema = z.enum([
  "air_raid",
  "artillery_shelling",
  "urban_fights",
  "chemical",
  "nuclear",
]);

export const AlertSourceSchema = z.enum(["alerts-in-ua", "neptun"]);

export const AlertSchema = z.object({
  id: z.number().int(),
  regionId: z.string(),
  regionName: z.string(),
  type: AlertTypeSchema,
  source: AlertSourceSchema,
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable(),
});

/** Нормалізована активна тривога, яку повертає адаптер джерела. */
export const SourceAlertSchema = z.object({
  externalId: z.string(),
  regionId: z.string(),
  regionName: z.string(),
  regionType: RegionTypeSchema,
  /** UID області, якщо регіон — район / громада / місто */
  parentRegionId: z.string().nullable(),
  type: AlertTypeSchema,
  source: AlertSourceSchema,
  startedAt: z.coerce.date(),
});

export const AlertsHistoryQuerySchema = z.object({
  regionId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
});
