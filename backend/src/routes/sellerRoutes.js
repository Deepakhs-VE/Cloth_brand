import express from 'express';
import { applyToSell, completeEmailReview, getMySellerProfile, getSellerSettlementsAdmin, getSellersAdmin, showEmailReview, updateSellerAdmin } from '../controllers/sellerController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { requireApprovedSeller, sellerFields, productFields, categoryFields } from '../middleware/sellerMiddleware.js';
import { getSellerDashboard } from '../controllers/sellerCatalogController.js';
import { getAllProductsAdmin, createProduct, updateProduct, deleteProduct, toggleProductStatus } from '../controllers/productController.js';
import { getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/review', showEmailReview);
router.post('/review', completeEmailReview);
router.post('/apply', protect, applyToSell);
router.get('/me', protect, getMySellerProfile);
router.get('/admin', protect, authorize('admin'), getSellersAdmin);
router.get('/admin/settlements', protect, authorize('admin'), getSellerSettlementsAdmin);
router.patch('/admin/:id', protect, authorize('admin'), updateSellerAdmin);

router.use(protect, authorize('seller'), requireApprovedSeller);
router.get('/dashboard', getSellerDashboard);
router.get('/products', getAllProductsAdmin);
router.post('/products', sellerFields(productFields), createProduct);
router.put('/products/:id', sellerFields(productFields), updateProduct);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/toggle-status', toggleProductStatus);
router.get('/categories', getAllCategoriesAdmin);
router.post('/categories', sellerFields(categoryFields), createCategory);
router.put('/categories/:id', sellerFields(categoryFields), updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
