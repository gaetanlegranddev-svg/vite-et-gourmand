import pkg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const { Pool } = pkg;
const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  host:     process.env.PG_HOST     || "localhost",
  port:     Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || "vite_gourmand",
  user:     process.env.PG_USER     || "postgres",
  password: process.env.PG_PASSWORD,
  client_encoding: 'UTF8',
  ...(isProduction && { ssl: { rejectUnauthorized: false } })
});