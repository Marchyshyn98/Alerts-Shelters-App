import { z } from "zod";

export const RegionTypeSchema = z.enum(["oblast", "raion", "hromada", "city"]);

export const RegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: RegionTypeSchema,
  parentId: z.string().nullable(),
});
