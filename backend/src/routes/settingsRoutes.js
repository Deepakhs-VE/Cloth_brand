import express from 'express';
import { getDeliveryQuote, getSiteSettings, updateSiteSettings } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSiteSettings);
router.post('/delivery-quote', getDeliveryQuote);
router.put('/', protect, authorize('admin'), updateSiteSettings);

export default router;
