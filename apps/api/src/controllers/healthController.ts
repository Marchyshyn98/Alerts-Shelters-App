import type { Request, Response } from "express";
import { getHealthService } from "../services/healthModel";

/** Після скількох секунд без успішної синхронізації тривог дані вважаються застарілими */
const STALE_AFTER_SECONDS = Number(process.env.HEALTH_STALE_AFTER_SECONDS ?? 180);

export const getHealth = async (_req: Request, res: Response) => {
    res.set("Cache-Control", "no-store");

    try {
        const row = await getHealthService();
        const age = row.alertsAgeSeconds;
        const fresh = age !== null && age <= STALE_AFTER_SECONDS;

        res.status(200).json({
            status: fresh ? "ok" : "degraded",
            database: "ok",
            sources: {
                alerts: { lastSuccess: row.alertsLastSuccess, ageSeconds: age },
                shelters: { lastSuccess: row.sheltersLastSuccess },
            },
        });
    } catch (error) {
        // БД не відповідає — сервіс недоступний
        console.error(error);
        res.status(503).json({
            status: "down",
            database: "down",
            sources: {
                alerts: { lastSuccess: null, ageSeconds: null },
                shelters: { lastSuccess: null },
            },
        });
    }
}
