// ============================================
// Vite & Gourmand — Modèle Mongoose : sessions
// Tokens JWT de connexion utilisateur
// ============================================
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    token: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  { collection: 'sessions' }
);

// Index TTL — supprime automatiquement les sessions expirées
sessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
