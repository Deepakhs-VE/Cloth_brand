import express from 'express';
import {
  submitContactMessage,
  getContactMessagesAdmin,
  updateContactMessageStatus,
  deleteContactMessage,
} from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', submitContactMessage);

// Admin
router.get('/', protect, authorize('admin'), getContactMessagesAdmin);
router.patch('/:id/status', protect, authorize('admin'), updateContactMessageStatus);
router.delete('/:id', protect, authorize('admin'), deleteContactMessage);

export default router;
