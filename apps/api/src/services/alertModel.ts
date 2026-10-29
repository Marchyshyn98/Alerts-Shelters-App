import pool from "../config/db";

export const getActiveAlertsService = async () => {
    const result = await pool.query(`
        SELECT a.id,
        a.region_id AS "regionId",
        r.name AS "regionName",
        a.type,
        a.source,
        a.started_at AS "startedAt",
        a.ended_at AS "endedAt"
        FROM alerts a
        JOIN regions r ON r.id = a.region_id
        WHERE a.ended_at IS NULL
        ORDER BY a.started_at DESC
        `);
    return result.rows;
}

type AlertFilters = { region: string | null; type: string | null; limit: number };

export const getAllAlertsService = async ({ region, type, limit }: AlertFilters) => {
    const result = await pool.query(
        `SELECT a.id,
        a.region_id AS "regionId",
        r.name AS "regionName",
        a.type,
        a.source,
        a.started_at AS "startedAt",
        a.ended_at AS "endedAt"
        FROM alerts a
        JOIN regions r ON r.id = a.region_id
        WHERE ($1::text IS NULL OR a.region_id = $1)
        AND ($2::text IS NULL OR a.type = $2)
        ORDER BY a.started_at DESC LIMIT $3`,
        [region, type, limit]
    );
    return result.rows;
}

