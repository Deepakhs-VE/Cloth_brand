import express from 'express';
import { upload } from '../config/multer.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { storeImage } from '../services/imageStorageService.js';

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
  async (req, res, next) => {
    try {
      const files = [...(req.files?.image || []), ...(req.files?.images || [])];
      if (!files.length) {
        return res.status(400).json({ success: false, message: 'Please select at least one image' });
      }

      const storedImages = await Promise.all(
        files.map((file) => storeImage(file, req.body.purpose))
      );

      res.status(201).json({
        success: true,
        message: `${storedImages.length} image${storedImages.length === 1 ? '' : 's'} uploaded successfully`,
        url: storedImages[0].url,
        urls: storedImages.map((image) => image.url),
        images: storedImages,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
