import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  requestRefund,
  reviewRefundRequestAdmin,
  requestExchange,
  updateExchangeRequestAdmin,
  requestItemReturn,
  updateItemReturnAdmin,
  downloadInvoice,
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
router.patch('/admin/:id/refund-request', authorize('admin'), reviewRefundRequestAdmin);
router.patch('/admin/:id/exchanges/:exchangeId', authorize('admin'), updateExchangeRequestAdmin);
router.patch('/admin/:id/item-returns/:requestId', authorize('admin'), updateItemReturnAdmin);

router.get('/:id', getOrderById);
router.get('/:id/invoice', downloadInvoice);
router.patch('/:id/cancel', cancelOrder);
router.post('/:id/refund-request', requestRefund);
router.post('/:id/exchanges', requestExchange);
router.post('/:id/item-returns', requestItemReturn);

export default router;
