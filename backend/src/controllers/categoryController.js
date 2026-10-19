import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import slugify from 'slugify';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort({ displayOrder: 1, name: 1 });

    // Parent categories represent their complete collection, including active
    // products saved under any active child category.
    const directCounts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countByCategory = new Map(directCounts.map(({ _id, count }) => [_id.toString(), count]));
    const childrenByParent = new Map();
    for (const category of categories) {
      const parentId = category.parent?._id?.toString();
      if (!parentId) continue;
      const childIds = childrenByParent.get(parentId) || [];
      childIds.push(category._id.toString());
      childrenByParent.set(parentId, childIds);
    }
    const totals = new Map();
    const getTotal = (categoryId) => {
      if (totals.has(categoryId)) return totals.get(categoryId);
      const total = (countByCategory.get(categoryId) || 0)
        + (childrenByParent.get(categoryId) || []).reduce((sum, childId) => sum + getTotal(childId), 0);
      totals.set(categoryId, total);
      return total;
    };
    const categoriesWithCount = categories.map((category) => ({
      ...category.toObject(),
      productCount: getTotal(category._id.toString()),
    }));

    res.status(200).json({ success: true, count: categoriesWithCount.length, categories: categoriesWithCount });
  } catch (error) {
    next(error);
  }
};

export const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('parent', 'name slug')
      .sort({ displayOrder: 1, createdAt: -1 });
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
    const {
      name, description, image, displayOrder, isActive, defaultSizeSystem, defaultSizes,
      parent, audience, attributeDefinitions, defaultReturnPolicy,
    } = req.body;

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
      defaultSizeSystem: defaultSizeSystem || 'alpha',
      defaultSizes: Array.isArray(defaultSizes) ? defaultSizes : [],
      parent: parent || null,
      audience: audience || 'all',
      attributeDefinitions: Array.isArray(attributeDefinitions) ? attributeDefinitions : [],
      defaultReturnPolicy: defaultReturnPolicy || undefined,
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

    if (req.body.parent === category._id.toString()) {
      return res.status(400).json({ success: false, message: 'A category cannot be its own parent' });
    }
    if (req.body.parent === '') req.body.parent = null;
    if (req.body.parent) {
      let ancestor = await Category.findById(req.body.parent).select('parent');
      if (!ancestor) return res.status(400).json({ success: false, message: 'Parent category does not exist' });
      while (ancestor) {
        if (ancestor._id.toString() === category._id.toString()) {
          return res.status(400).json({ success: false, message: 'This parent selection would create a category cycle' });
        }
        ancestor = ancestor.parent ? await Category.findById(ancestor.parent).select('parent') : null;
      }
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

    const childCategories = await Category.countDocuments({ parent: category._id });
    if (childCategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a category that still has subcategories. Reassign or delete the subcategories first.',
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
