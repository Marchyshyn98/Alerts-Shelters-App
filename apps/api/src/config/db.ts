import pkg from "pg"; // import package from postgreclient
const { Pool } = pkg; // destructure the Pool class from the pg package
import dotenv from "dotenv";

dotenv.config();

export const dbConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT) || 5432,
}

// Create a new instance of the Pool class with the database configuration
const pool = new Pool(dbConfig);

pool.on("connect", () => {
  console.log("Connected to the database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool; // export the pool instance for use in other modules

