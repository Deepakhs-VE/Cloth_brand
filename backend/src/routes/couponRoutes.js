import express from 'express';
import {
  validateCoupon,
  getCoupons,
  getPublicCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/public', getPublicCoupons);
router.post('/validate', protect, validateCoupon);

// Admin
router.get('/', protect, authorize('admin'), getCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

export default router;
