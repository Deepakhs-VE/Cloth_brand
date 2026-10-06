import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);

// Admin routes (must precede :id)
router.get('/admin/all', authorize('admin'), getAllOrdersAdmin);
router.route('/admin/:id/status')
  .patch(authorize('admin'), updateOrderStatusAdmin)
  .put(authorize('admin'), updateOrderStatusAdmin);

router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

export default router;
