import pool from "../config/db";

type shelterFilters = { city: string | null; address: string | null };

export const getAllSheltersService = async ({ city, address }: shelterFilters) => {
    const result = await pool.query(
        `SELECT id, type, address, city, district, capacity, source,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lon
        FROM shelters
        WHERE ($1::text IS NULL OR city = $1)
        AND ($2::text IS NULL OR address ILIKE '%' || $2 || '%')
        ORDER BY city`, [city, address]);
    return result.rows;
}

export const getShelterDetailsService = async (id: string | string[] | undefined) => {
    const result = await pool.query(
        `
        SELECT * FROM shelters
        WHERE (id = $1)
        `, [id]);
    return result.rows;
}