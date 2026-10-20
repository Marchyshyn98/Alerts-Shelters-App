import { z } from "zod";

export const ShelterSchema = z.object({
  id: z.number().int(),
  type: z.string(),
  address: z.string(),
  city: z.string().nullable(),
  district: z.string().nullable(),
  capacity: z.number().int().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  source: z.string(),
});

export const NearbyShelterSchema = ShelterSchema.extend({
  distanceM: z.number(),
});

export const NearbySheltersQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().positive().max(20_000).default(2_000),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export const SheltersQuerySchema = z.object({
  city: z.string().optional(),
  address: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});
