// ============================================
// Vite & Gourmand — Modèle Mongoose : statistics
// Statistiques des commandes par menu (dashboard admin)
// ============================================
import mongoose from 'mongoose';

const statisticSchema = new mongoose.Schema(
  {
    menu_id: { type: String, required: true },
    menu_title: { type: String, required: true },
    total_orders: { type: Number, default: 0 },
    total_revenue: { type: Number, default: 0 },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: 'statistics' }
);

export default mongoose.model('Statistic', statisticSchema);
