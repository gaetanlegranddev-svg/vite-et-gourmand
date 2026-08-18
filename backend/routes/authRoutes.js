// ============================================
// Routes d'authentification
// ============================================
import express from 'express';
import { inscription, connexion, profil } from '../controllers/authController.js';
import { verifierToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/inscription
router.post('/inscription', inscription);

// POST /api/auth/connexion
router.post('/connexion', connexion);

// GET /api/auth/profil (protégée)
router.get('/profil', verifierToken, profil);

export default router;