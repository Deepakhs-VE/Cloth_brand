import { Seller } from '../models/Seller.js';

export const requireApprovedSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id, status: 'APPROVED' });
    if (!seller) return res.status(403).json({ success: false, message: 'An approved seller account is required to manage your catalog.' });
    req.seller = seller;
    next();
  } catch (error) { next(error); }
};

// Seller requests cannot transfer ownership or modify administrative fields.
export const sellerFields = (fields) => (req, res, next) => {
  req.body = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => fields.includes(key)));
  next();
};

export const productFields = ['name', 'description', 'shortDescription', 'images', 'price', 'discountPrice', 'category', 'sku', 'stock', 'isActive', 'tags', 'specifications', 'sizes', 'colors', 'variants', 'sizeSystem', 'fit', 'fabric', 'garmentType', 'audience', 'colorOptions', 'fashionDetails', 'sizeChart', 'returnPolicy', 'commerce'];
export const categoryFields = ['name', 'description', 'image', 'isActive', 'defaultSizeSystem', 'defaultSizes', 'parent', 'audience', 'attributeDefinitions', 'defaultReturnPolicy'];
