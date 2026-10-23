import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

export const getSellerDashboard = async (req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ seller: req.seller._id }).select('name stock isActive slug images updatedAt').sort({ updatedAt: -1 }),
      Category.countDocuments({ createdBySeller: req.seller._id }),
    ]);
    res.json({ success: true, stats: {
      products: products.length, active: products.filter((p) => p.isActive).length,
      lowStock: products.filter((p) => p.stock <= 5).length,
      units: products.reduce((sum, p) => sum + p.stock, 0), categories,
    }, recentProducts: products.slice(0, 5) });
  } catch (error) { next(error); }
};
