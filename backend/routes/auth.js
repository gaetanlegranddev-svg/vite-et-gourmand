// ============================================
// Vite & Gourmand — Auth Routes
// ============================================
import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile (protected)
router.get('/profile', authenticate, getProfile);

// PUT /api/auth/profile (protected)
router.put('/profile', authenticate, updateProfile);

export default router;