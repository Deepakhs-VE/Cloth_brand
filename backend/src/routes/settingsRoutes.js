import express from 'express';
import { getSiteSettings, updateSiteSettings } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSiteSettings);
router.put('/', protect, authorize('admin'), updateSiteSettings);

export default router;
