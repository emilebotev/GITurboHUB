import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.POSTGRESQL_USER,
  port: parseInt(process.env.POSTGRESQL_PORT || "5432", 10),
  host: process.env.POSTGRESQL_HOST,
  database: process.env.POSTGRESQL_DB,
  password: process.env.POSTGRESQL_PASSWORD,
});
