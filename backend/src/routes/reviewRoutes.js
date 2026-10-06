import express from 'express';
import {
  getProductReviews,
  submitReview,
  getAllReviewsAdmin,
  moderateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.post('/', protect, submitReview);

// Admin
router.get('/admin/all', protect, authorize('admin'), getAllReviewsAdmin);
router.patch('/admin/:id/moderate', protect, authorize('admin'), moderateReview);
router.delete('/admin/:id', protect, authorize('admin'), deleteReview);

export default router;
