// ============================================
// Vite & Gourmand — Serveur Express
// ============================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import mongoose from 'mongoose';

dotenv.config({ path: './backend/.env' });

const app = express();
const { Pool } = pkg;

// ── Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());

// ── PostgreSQL ──────────────────────────────
const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user:     process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL connecté'))
  .catch(err => console.error('❌ Erreur PostgreSQL :', err));

// ── MongoDB ─────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

// ── Routes ───────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'API Vite & Gourmand opérationnelle 🚀' });
});

// ── Démarrage ────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

export { pool };