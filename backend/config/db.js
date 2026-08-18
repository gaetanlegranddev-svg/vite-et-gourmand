// ============================================
// Vite & Gourmand — Connexion PostgreSQL
// ============================================
import pkg from 'pg';

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});
