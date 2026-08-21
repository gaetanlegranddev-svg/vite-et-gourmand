// ============================================
// Vite & Gourmand — Routes : /api/hours
// Horaires d'ouverture (MongoDB, publics)
// ============================================
import { Router } from 'express';
import HourSlot from '../models/HourSlot.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const slots = await HourSlot.find().sort({ _id: 1 });
    res.json({ hours: slots });
  })
);

export default router;
