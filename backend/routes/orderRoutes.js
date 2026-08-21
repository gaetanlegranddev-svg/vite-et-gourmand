// ============================================
// Vite & Gourmand — Routes : /api/orders
// Toutes les routes commandes nécessitent d'être connecté
// ============================================
import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  addReview,
  getOrderStatusHistory,
} from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createOrder);
// ⚠️ /me doit être déclaré avant /:id sinon "me" est interprété comme un id
router.get('/me', getMyOrders);
router.get('/', authorize('admin', 'employee'), getAllOrders);
router.get('/:id', getOrderById);
router.get('/:id/history', getOrderStatusHistory);
router.patch('/:id/status', authorize('admin', 'employee'), updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);
router.post('/:id/review', addReview);

export default router;
