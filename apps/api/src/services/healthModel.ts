import pool from "../config/db";

export type HealthRow = {
    alertsLastSuccess: Date | null;
    alertsAgeSeconds: number | null;
    sheltersLastSuccess: Date | null;
};

export const getHealthService = async (): Promise<HealthRow> => {
    const result = await pool.query(
        `
        WITH alerts_sync AS (
            SELECT MAX(last_success) AS last_success FROM sync_status
        )
        SELECT
            a.last_success AS "alertsLastSuccess",
            FLOOR(EXTRACT(EPOCH FROM (now() - a.last_success)))::int AS "alertsAgeSeconds",
            (SELECT MAX(imported_at) FROM shelters) AS "sheltersLastSuccess"
          FROM alerts_sync a
        `);
    return result.rows[0];
}
