import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import slugify from 'slugify';

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      rating,
      sort,
      isFeatured,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    // Search query across name, description, tags
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Category filter by slug or ID
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const foundCat = await Category.findOne({ slug: category });
        if (foundCat) {
          query.category = foundCat._id;
        } else {
          // If specified category slug doesn't exist, return empty
          return res.status(200).json({
            success: true,
            products: [],
            total: 0,
            page: Number(page),
            pages: 0,
          });
        }
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    // In Stock filter
    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }

    // Rating filter
    if (rating) {
      query.averageRating = { $gte: Number(rating) };
    }

    // Featured filter
    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { averageRating: -1, numReviews: -1 };
    else if (sort === 'featured') sortOption = { isFeatured: -1, createdAt: -1 };
    else if (sort === 'name_asc') sortOption = { name: 1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .limit(8)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      $or: [{ slug: req.params.slug }, { _id: req.params.slug.match(/^[0-9a-fA-F]{24}$/) ? req.params.slug : null }],
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Fetch related products in the same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(4)
      .select('name slug price discountPrice images averageRating numReviews stock');

    res.status(200).json({ success: true, product, relatedProducts });
  } catch (error) {
    next(error);
  }
};

export const getAllProductsAdmin = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      shortDescription,
      images,
      price,
      discountPrice,
      category,
      sku,
      stock,
      isFeatured,
      isActive,
      tags,
      specifications,
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and category are required',
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one product image',
      });
    }

    let slug = slugify(name, { lower: true, strict: true });
    // Check if slug exists and make unique if needed
    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await Product.create({
      name,
      slug,
      description,
      shortDescription: shortDescription || '',
      images,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      category,
      sku: sku || `SKU-${Date.now()}`,
      stock: Number(stock) || 0,
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      tags: tags || [],
      specifications: specifications || [],
    });

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    Object.assign(product, req.body);
    await product.save();

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product is now ${product.isActive ? 'active' : 'inactive'}`,
      product,
    });
  } catch (error) {
    next(error);
  }
};
