import pool from "../config/db";

type statsSummaryFilters = { days: number };

export const getStatsSummaryService = async ({ days }: statsSummaryFilters) => {
    const result = await pool.query(
        `
        WITH period_alerts AS (
            SELECT a.region_id,
                   EXTRACT(EPOCH FROM (COALESCE(a.ended_at, now()) - a.started_at)) / 60 AS minutes
              FROM alerts a
             WHERE a.started_at >= now() - make_interval(days => $1::int)
        ),
        by_region AS (
            SELECT r.id AS "regionId",
                   r.name AS "regionName",
                   COUNT(*)::int AS alerts,
                   ROUND(SUM(pa.minutes)::numeric, 1)::float AS "totalMinutes",
                   ROUND(AVG(pa.minutes)::numeric, 1)::float AS "averageMinutes"
              FROM period_alerts pa
              JOIN regions r ON r.id = pa.region_id
             GROUP BY r.id, r.name
        ),
        by_city AS (
            SELECT s.city, COUNT(*)::int AS shelters
              FROM shelters s
             GROUP BY s.city
        )
        SELECT
            $1::int AS days,
            (SELECT COUNT(*)::int FROM alerts WHERE ended_at IS NULL) AS "activeAlerts",
            COALESCE(
                (SELECT json_agg(br ORDER BY br.alerts DESC, br."totalMinutes" DESC) FROM by_region br),
                '[]'::json
            ) AS "byRegion",
            COALESCE(
                (SELECT json_agg(bc ORDER BY bc.shelters DESC) FROM by_city bc),
                '[]'::json
            ) AS "sheltersByCity"
        `, [days]);
    return result.rows[0];
}
