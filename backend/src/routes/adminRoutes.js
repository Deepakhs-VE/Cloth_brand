import express from 'express';
import {
  getDashboardStats,
  getAllUsersAdmin,
  updateUserStatusAdmin,
} from '../controllers/adminDashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/users', getAllUsersAdmin);
router.patch('/users/:id/status', updateUserStatusAdmin);

export default router;
