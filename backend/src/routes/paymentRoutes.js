import express from 'express';
import { processPayment, refundPayment } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/process', protect, processPayment);
router.post('/refund', protect, authorize('admin'), refundPayment);

export default router;
