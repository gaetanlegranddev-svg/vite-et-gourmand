// ============================================
// Vite & Gourmand — Routes : /api/menus
// ============================================
import { Router } from 'express';
import {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getDishes,
  getAllergens,
} from '../controllers/menuController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Routes publiques (consultation du catalogue)
// ⚠️ Les routes /meta/* doivent être déclarées AVANT /:id
// sinon Express les interprète comme un id de menu.
router.get('/', getMenus);
router.get('/meta/dishes', getDishes);
router.get('/meta/allergens', getAllergens);
router.get('/:id', getMenuById);

// Routes réservées à l'administration
router.post('/', authenticate, authorize('admin'), createMenu);
router.put('/:id', authenticate, authorize('admin'), updateMenu);
router.delete('/:id', authenticate, authorize('admin'), deleteMenu);

export default router;
