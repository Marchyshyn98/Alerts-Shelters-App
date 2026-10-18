import { AlertTypeSchema, RegionTypeSchema, type SourceAlert } from "@alerts-shelters/shared";
import { z } from "zod";
import type { AlertSourceAdapter } from "./types";

const API_URL = "https://api.alerts.in.ua/v1/alerts/active.json";

const ResponseSchema = z.object({
  alerts: z.array(
    z.object({
      id: z.coerce.string(),
      location_title: z.string(),
      location_type: z.string(),
      location_uid: z.coerce.string(),
      location_oblast_uid: z.coerce.string().nullish(),
      alert_type: z.string(),
      started_at: z.string(),
    }),
  ),
});

export function createAlertsInUaSource(token: string): AlertSourceAdapter {
  return {
    name: "alerts-in-ua",
    async fetchActive() {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`alerts.in.ua responded ${res.status}`);

      const { alerts } = ResponseSchema.parse(await res.json());

      return alerts.flatMap((a): SourceAlert[] => {
        const type = AlertTypeSchema.safeParse(a.alert_type);
        const regionType = RegionTypeSchema.safeParse(a.location_type);
        if (!type.success || !regionType.success) return [];

        const parent = a.location_oblast_uid;
        return [
          {
            externalId: a.id,
            regionId: a.location_uid,
            regionName: a.location_title,
            regionType: regionType.data,
            parentRegionId: parent && parent !== a.location_uid ? parent : null,
            type: type.data,
            source: "alerts-in-ua",
            startedAt: new Date(a.started_at),
          },
        ];
      });
    },
  };
}
