// ============================================
// Connexion PostgreSQL séparée
// ============================================
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const { Pool } = pkg;

export const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user:     process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL connecté'))
  .catch(err => console.error('❌ Erreur PostgreSQL :', err));