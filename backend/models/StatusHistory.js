// ============================================
// Vite & Gourmand — Modèle Mongoose : status_history
// Historique des statuts de chaque commande
// ============================================
import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: [
        'en attente',
        'accepté',
        'en préparation',
        'en cours de livraison',
        'livré',
        'en attente du retour de matériel',
        'terminée',
        'annulée',
      ],
    },
    at: { type: Date, required: true, default: Date.now },
    note: { type: String },
  },
  { collection: 'status_history' }
);

export default mongoose.model('StatusHistory', statusHistorySchema);
