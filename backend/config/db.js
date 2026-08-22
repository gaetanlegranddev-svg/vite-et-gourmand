import pkg from "pg";
const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  host:     process.env.PG_HOST     || "localhost",
  port:     Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || "vite_gourmand",
  user:     process.env.PG_USER     || "postgres",
  password: process.env.PG_PASSWORD || "Paris.123456*",
  ...(isProduction && { ssl: { rejectUnauthorized: false } })
});
