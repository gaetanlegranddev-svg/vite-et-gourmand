// ============================================
// Vite & Gourmand — Modèle Mongoose : hour_slots
// Horaires d'ouverture du lundi au dimanche
// ============================================
import mongoose from 'mongoose';

const hourSlotSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    time: { type: String, required: true },
  },
  { collection: 'hour_slots' }
);

export default mongoose.model('HourSlot', hourSlotSchema);
