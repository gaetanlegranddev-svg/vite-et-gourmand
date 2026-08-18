// ============================================
// Vite & Gourmand — Serveur Express
// ============================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import { pool } from './db.js';

dotenv.config({ path: './backend/.env' });

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

app.get('/', (req, res) => {
  res.json({ message: 'API Vite & Gourmand opérationnelle 🚀' });
});

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

export { pool };