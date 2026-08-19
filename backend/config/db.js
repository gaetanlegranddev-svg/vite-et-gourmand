// ============================================
// Vite & Gourmand — PostgreSQL Connection
// ============================================
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const { Pool } = pkg;

export const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     Number(process.env.PG_PORT),
  database: process.env.PG_DATABASE,
  user:     process.env.PG_USER,
  password: String(process.env.PG_PASSWORD),
});