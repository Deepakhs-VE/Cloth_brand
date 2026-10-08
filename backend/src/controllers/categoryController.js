import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import slugify from 'slugify';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });

    // Attach product count to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id, isActive: true });
        return {
          ...cat.toObject(),
          productCount,
        };
      })
    );

    res.status(200).json({ success: true, count: categoriesWithCount.length, categories: categoriesWithCount });
  } catch (error) {
    next(error);
  }
};

export const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, displayOrder, isActive } = req.body;

    if (!name || !image) {
      return res.status(400).json({ success: false, message: 'Category name and banner image are required' });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      name,
      slug,
      description: description || '',
      image,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (req.body.name && req.body.name !== category.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    Object.assign(category, req.body);
    await category.save();

    res.status(200).json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if products exist in category
    const productsInCat = await Product.countDocuments({ category: category._id });
    if (productsInCat > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${productsInCat} products associated with it. Please reassign or delete them first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
