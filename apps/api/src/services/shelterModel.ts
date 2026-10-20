import pool from "../config/db";

type shelterFilters = { city: string | null; address: string | null };
type sheltersNearbyFilters = { lat: number; lon: number; radius: number; limit: number; };

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

export const getSheltersNearbyService = async ({ lat, lon, radius, limit }: sheltersNearbyFilters) => {
    const result = await pool.query(
        `
        WITH me AS (SELECT ST_SetSRID(ST_MakePoint($2, $1), 4326) AS point)
        SELECT s.id, s.type, s.address, s.city, s.district, s.capacity, s.source,
               ST_Y(s.location) AS lat,
               ST_X(s.location) AS lon,
               ST_Distance(s.location::geography, me.point::geography) AS "distanceM"
          FROM shelters s, me
         WHERE s.location IS NOT NULL
           AND ST_DWithin(s.location::geography, me.point::geography, $3)
         ORDER BY s.location <-> me.point
         LIMIT $4
        `, [lat, lon, radius, limit]);
    return result.rows;
}