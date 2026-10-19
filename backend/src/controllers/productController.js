import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { convertFromBase, convertCurrency } from '../utils/exchangeRateService.js';
import slugify from 'slugify';

const normalizeVariants = (variants = [], baseSku = `SKU-${Date.now()}`) => {
  if (!Array.isArray(variants)) return [];
  return variants.map((variant, index) => ({
    ...(variant._id ? { _id: variant._id } : {}),
    sku: String(variant.sku || `${baseSku}-${index + 1}`).trim().toUpperCase(),
    size: String(variant.size || '').trim(),
    color: String(variant.color || '').trim(),
    stock: Math.max(0, Number(variant.stock) || 0),
    price: variant.price === '' || variant.price === null || variant.price === undefined
      ? null
      : Number(variant.price),
    discountPrice:
      variant.discountPrice === '' || variant.discountPrice === null || variant.discountPrice === undefined
        ? null
        : Number(variant.discountPrice),
    basePrice: variant.basePrice === '' || variant.basePrice === null || variant.basePrice === undefined ? (variant.price === '' || variant.price === null || variant.price === undefined ? null : Number(variant.price)) : Number(variant.basePrice),
    baseDiscountPrice: variant.baseDiscountPrice === '' || variant.baseDiscountPrice === null || variant.baseDiscountPrice === undefined ? (variant.discountPrice === '' || variant.discountPrice === null || variant.discountPrice === undefined ? null : Number(variant.discountPrice)) : Number(variant.baseDiscountPrice),
    images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
    isActive: variant.isActive !== false,
  }));
};

const validateVariants = (variants, basePrice) => {
  const combinations = new Set();
  const skus = new Set();
  for (const variant of variants) {
    const combination = `${variant.size.toLowerCase()}::${variant.color.toLowerCase()}`;
    if (combinations.has(combination)) {
      const error = new Error(`Duplicate size and colour combination: ${variant.size || 'One size'} / ${variant.color || 'Default'}`);
      error.statusCode = 400;
      throw error;
    }
    if (skus.has(variant.sku)) {
      const error = new Error(`Duplicate variant SKU: ${variant.sku}`);
      error.statusCode = 400;
      throw error;
    }
    const regularPrice = variant.price ?? Number(basePrice);
    if (!Number.isFinite(regularPrice) || regularPrice < 0 || (variant.discountPrice !== null && variant.discountPrice < 0)) {
      const error = new Error(`Variant prices must be valid non-negative amounts for ${variant.sku}`);
      error.statusCode = 400;
      throw error;
    }
    if (variant.discountPrice !== null && variant.discountPrice >= regularPrice) {
      const error = new Error(`Sale price must be lower than the regular price for ${variant.sku}`);
      error.statusCode = 400;
      throw error;
    }
    combinations.add(combination);
    skus.add(variant.sku);
  }
};

const ensureVariantSkusAreAvailable = async (variants, excludeProductId = null) => {
  if (!variants.length) return;
  const variantSkus = variants.map((variant) => variant.sku);
  const query = {
    $or: [
      { sku: { $in: variantSkus } },
      { 'variants.sku': { $in: variantSkus } },
    ],
  };
  if (excludeProductId) query._id = { $ne: excludeProductId };
  const conflict = await Product.findOne(query).select('name sku variants.sku');
  if (conflict) {
    const usedSkus = new Set([conflict.sku, ...conflict.variants.map((variant) => variant.sku)]);
    const duplicate = variants.find((variant) => usedSkus.has(variant.sku));
    const error = new Error(`Variant SKU ${duplicate?.sku || ''} is already used by another product`);
    error.statusCode = 409;
    throw error;
  }
};

// Products belong to a final, purchasable category only. Parent categories are
// navigation groups and should collect their products through child categories.
const ensureLeafCategory = async (categoryId) => {
  const category = await Category.findById(categoryId).select('_id name isActive');
  if (!category || !category.isActive) {
    const error = new Error('Select an active product category');
    error.statusCode = 400;
    throw error;
  }

  const hasChildren = await Category.exists({ parent: category._id });
  if (hasChildren) {
    const error = new Error(`“${category.name}” is a parent category. Please select one of its final subcategories.`);
    error.statusCode = 400;
    throw error;
  }
  return category;
};

const withDisplayCurrency = async (product, settings) => {
  const source = product.toObject ? product.toObject() : product;
  const convert = (value) => convertFromBase(value, settings);
  const result = { ...source, currency: settings.commerce?.currencyCode || 'EUR' };
  result.price = await convert(source.basePrice ?? source.price);
  result.discountPrice = source.baseDiscountPrice === null || source.baseDiscountPrice === undefined
    ? (source.discountPrice === null || source.discountPrice === undefined ? null : await convert(source.discountPrice))
    : await convert(source.baseDiscountPrice);
  result.variants = await Promise.all((source.variants || []).map(async (variant) => ({
    ...variant,
    price: variant.basePrice === null || variant.basePrice === undefined ? variant.price : await convert(variant.basePrice),
    discountPrice: variant.baseDiscountPrice === null || variant.baseDiscountPrice === undefined ? variant.discountPrice : await convert(variant.baseDiscountPrice),
  })));
  return result;
};

const getStoreSettings = async () => {
  let settings = await SiteSettings.findOne();
  if (!settings) settings = await SiteSettings.create({});
  return settings;
};

const submittedPricesToBase = async (price, discountPrice, variants, settings) => {
  const inputCurrency = String(settings.commerce?.currencyCode || 'EUR').toUpperCase();
  const baseCurrency = String(settings.commerce?.baseCurrencyCode || 'EUR').toUpperCase();
  // Keep base values at full precision. Rounding here would make a price such
  // as ₹200 come back as ₹199.67 after an INR → EUR → INR round trip.
  const basePrice = await convertCurrency(price, inputCurrency, baseCurrency, settings, { round: false });
  const baseDiscountPrice = discountPrice === null || discountPrice === undefined || discountPrice === ''
    ? null
    : await convertCurrency(discountPrice, inputCurrency, baseCurrency, settings, { round: false });
  const baseVariants = await Promise.all(variants.map(async (variant) => {
    const variantBasePrice = variant.price === null ? null : await convertCurrency(variant.price, inputCurrency, baseCurrency, settings, { round: false });
    const variantBaseDiscountPrice = variant.discountPrice === null ? null : await convertCurrency(variant.discountPrice, inputCurrency, baseCurrency, settings, { round: false });
    return {
      ...variant,
      price: variantBasePrice,
      discountPrice: variantBaseDiscountPrice,
      basePrice: variantBasePrice,
      baseDiscountPrice: variantBaseDiscountPrice,
    };
  }));
  return { basePrice, baseDiscountPrice, baseVariants, baseCurrency };
};

// Repairs products made while a non-EUR store currency was selected before
// product creation began converting incoming prices to the EUR base currency.
const repairLegacyCurrencyPrices = async (settings) => {
  const baseCurrency = String(settings.commerce?.baseCurrencyCode || 'EUR').toUpperCase();
  const legacyProducts = await Product.find({
    pricingVersion: { $ne: 2 },
    baseCurrency,
    'commerce.currency': { $exists: true, $ne: baseCurrency },
  });
  for (const product of legacyProducts) {
    const sourceCurrency = String(product.commerce?.currency || baseCurrency).toUpperCase();
    product.basePrice = await convertCurrency(product.basePrice ?? product.price, sourceCurrency, baseCurrency, settings);
    product.baseDiscountPrice = product.baseDiscountPrice === null || product.baseDiscountPrice === undefined
      ? null
      : await convertCurrency(product.baseDiscountPrice, sourceCurrency, baseCurrency, settings);
    product.price = product.basePrice;
    product.discountPrice = product.baseDiscountPrice;
    product.variants = await Promise.all(product.variants.map(async (variant) => {
      const price = variant.basePrice === null || variant.basePrice === undefined ? variant.price : variant.basePrice;
      const discountPrice = variant.baseDiscountPrice === null || variant.baseDiscountPrice === undefined ? variant.discountPrice : variant.baseDiscountPrice;
      const convertedPrice = price === null || price === undefined ? null : await convertCurrency(price, sourceCurrency, baseCurrency, settings);
      const convertedDiscountPrice = discountPrice === null || discountPrice === undefined ? null : await convertCurrency(discountPrice, sourceCurrency, baseCurrency, settings);
      return { ...variant.toObject(), price: convertedPrice, discountPrice: convertedDiscountPrice, basePrice: convertedPrice, baseDiscountPrice: convertedDiscountPrice };
    }));
    product.pricingVersion = 2;
    await product.save();
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const settings = await getStoreSettings();
    await repairLegacyCurrencyPrices(settings);
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      rating,
      sort,
      isFeatured,
      fit,
      fabric,
      size,
      color,
      audience,
      occasion,
      pattern,
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
          const categoryIds = [foundCat._id];
          let parentIds = [foundCat._id];
          while (parentIds.length) {
            const children = await Category.find({ parent: { $in: parentIds }, isActive: true }).select('_id');
            parentIds = children.map((child) => child._id);
            categoryIds.push(...parentIds);
          }
          query.category = { $in: categoryIds };
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

    if (fit) query.fit = fit;
    if (fabric) query.fabric = { $regex: String(fabric).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (audience) query.audience = audience;
    if (occasion) query['fashionDetails.occasion'] = occasion;
    if (pattern) query['fashionDetails.pattern'] = pattern;
    if (size) query.variants = { $elemMatch: { size, stock: { $gt: 0 }, isActive: true } };
    if (color) query.variants = {
      $elemMatch: {
        ...(query.variants?.$elemMatch || {}),
        color,
        stock: { $gt: 0 },
        isActive: true,
      },
    };

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
      products: await Promise.all(products.map((product) => withDisplayCurrency(product, settings))),
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const settings = await getStoreSettings();
    await repairLegacyCurrencyPrices(settings);
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .limit(8)
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, products: await Promise.all(products.map((product) => withDisplayCurrency(product, settings)) ) });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const settings = await getStoreSettings();
    await repairLegacyCurrencyPrices(settings);
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
      .select('name slug price discountPrice basePrice baseDiscountPrice images averageRating numReviews stock');
    res.status(200).json({
      success: true,
      product: await withDisplayCurrency(product, settings),
      relatedProducts: await Promise.all(relatedProducts.map((entry) => withDisplayCurrency(entry, settings))),
    });
  } catch (error) {
    next(error);
  }
};

export const getAllProductsAdmin = async (req, res, next) => {
  try {
    const settings = await getStoreSettings();
    await repairLegacyCurrencyPrices(settings);
    const { search, category, status, productId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (productId?.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = productId;
    } else if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
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
      products: await Promise.all(products.map((product) => withDisplayCurrency(product, settings))),
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
      sizes,
      colors,
      variants,
      sizeSystem,
      fit,
      fabric,
      garmentType,
      audience,
      colorOptions,
      fashionDetails,
      sizeChart,
      returnPolicy,
      commerce,
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and category are required',
      });
    }

    await ensureLeafCategory(category);

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

    const resolvedSku = sku || `SKU-${Date.now()}`;
    const normalizedVariants = normalizeVariants(variants, resolvedSku);
    if (discountPrice !== null && discountPrice !== undefined && discountPrice !== '' && Number(discountPrice) >= Number(price)) {
      return res.status(400).json({ success: false, message: 'Sale price must be lower than the regular product price' });
    }
    validateVariants(normalizedVariants, price);
    if (returnPolicy?.finalSale && !returnPolicy?.exemptionReason) {
      return res.status(400).json({ success: false, message: 'Select the applicable consumer-rights exemption for a non-returnable product' });
    }
    await ensureVariantSkusAreAvailable(normalizedVariants);
    const settings = await getStoreSettings();
    const { basePrice, baseDiscountPrice, baseVariants, baseCurrency } = await submittedPricesToBase(
      Number(price),
      discountPrice,
      normalizedVariants,
      settings
    );

    const product = await Product.create({
      name,
      slug,
      description,
      shortDescription: shortDescription || '',
      images,
      price: basePrice,
      discountPrice: baseDiscountPrice,
      basePrice,
      baseDiscountPrice,
      baseCurrency,
      pricingVersion: 2,
      category,
      sku: resolvedSku,
      stock: normalizedVariants.length
        ? normalizedVariants.filter((variant) => variant.isActive).reduce((sum, variant) => sum + variant.stock, 0)
        : Number(stock) || 0,
      sizes: Array.isArray(sizes) ? sizes : [],
      colors: Array.isArray(colors) ? colors : [],
      variants: baseVariants,
      sizeSystem: sizeSystem || 'alpha',
      fit: fit || '',
      fabric: fabric || '',
      garmentType: garmentType || '',
      audience: audience || 'all',
      colorOptions: Array.isArray(colorOptions) ? colorOptions : [],
      fashionDetails: fashionDetails || {},
      sizeChart: sizeChart || {},
      returnPolicy: returnPolicy || {},
      commerce: commerce || {},
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

    await ensureLeafCategory(req.body.category || product.category);

    if (req.body.variants !== undefined) {
      req.body.variants = normalizeVariants(req.body.variants, req.body.sku || product.sku);
      validateVariants(req.body.variants, req.body.price ?? product.price);
      await ensureVariantSkusAreAvailable(req.body.variants, product._id);
      req.body.stock = req.body.variants.filter((variant) => variant.isActive).reduce((sum, variant) => sum + variant.stock, 0);
    }

    const nextPrice = Number(req.body.price ?? product.price);
    const nextDiscountPrice = req.body.discountPrice === '' ? null : (req.body.discountPrice ?? product.discountPrice);
    if (nextDiscountPrice !== null && nextDiscountPrice !== undefined && Number(nextDiscountPrice) >= nextPrice) {
      return res.status(400).json({ success: false, message: 'Sale price must be lower than the regular product price' });
    }
    const nextReturnPolicy = req.body.returnPolicy ?? product.returnPolicy;
    if (nextReturnPolicy?.finalSale && !nextReturnPolicy?.exemptionReason) {
      return res.status(400).json({ success: false, message: 'Select the applicable consumer-rights exemption for a non-returnable product' });
    }

    const settings = await getStoreSettings();
    const normalizedVariants = req.body.variants ?? product.variants.map((variant) => variant.toObject());
    const { basePrice, baseDiscountPrice, baseVariants, baseCurrency } = await submittedPricesToBase(
      nextPrice,
      nextDiscountPrice,
      normalizedVariants,
      settings
    );
    req.body.price = basePrice;
    req.body.discountPrice = baseDiscountPrice;
    req.body.basePrice = basePrice;
    req.body.baseDiscountPrice = baseDiscountPrice;
    req.body.baseCurrency = baseCurrency;
    req.body.pricingVersion = 2;
    if (req.body.variants !== undefined) req.body.variants = baseVariants;

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
