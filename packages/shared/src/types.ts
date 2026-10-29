import type { z } from "zod";
import type * as s from "./schemas";

export type Alert = z.infer<typeof s.AlertSchema>;
export type AlertType = z.infer<typeof s.AlertTypeSchema>;
export type AlertSource = z.infer<typeof s.AlertSourceSchema>;
export type SourceAlert = z.infer<typeof s.SourceAlertSchema>;
export type AlertsHistoryQuery = z.infer<typeof s.AlertsHistoryQuerySchema>;
export type Region = z.infer<typeof s.RegionSchema>;
export type RegionType = z.infer<typeof s.RegionTypeSchema>;
export type Shelter = z.infer<typeof s.ShelterSchema>;
export type NearbyShelter = z.infer<typeof s.NearbyShelterSchema>;
export type NearbySheltersQuery = z.infer<typeof s.NearbySheltersQuerySchema>;
export type SheltersQuery = z.infer<typeof s.SheltersQuerySchema>;
export type StatsQuery = z.infer<typeof s.StatsQuerySchema>;
export type StatsSummary = z.infer<typeof s.StatsSummarySchema>;
export type HealthStatus = z.infer<typeof s.HealthStatusSchema>;
export type Health = z.infer<typeof s.HealthSchema>;
