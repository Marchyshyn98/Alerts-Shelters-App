import pool from "../config/db";

type regionFilters = { type: string | null; parent: string | null };

export const getAllRegionsService = async ({ type, parent }: regionFilters) => {
    const result = await pool.query(
        `SELECT * FROM regions
        WHERE ($1::text IS NULL OR type = $1)
        AND ($2::text IS NULL OR parent_id = $2)
        ORDER BY name`,
        [type, parent]
    );
    return result.rows;
} 