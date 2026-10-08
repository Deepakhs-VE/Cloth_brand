import express from 'express';
import {
  createCheckoutSession,
  confirmStripePayment,
  cancelCheckoutSession,
  refundPayment,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/checkout-session', protect, createCheckoutSession);
router.get('/confirm/:sessionId', protect, confirmStripePayment);
router.post('/cancel-checkout', protect, cancelCheckoutSession);
router.post('/refund', protect, authorize('admin'), refundPayment);

export default router;
