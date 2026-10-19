import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { convertFromBase } from '../utils/exchangeRateService.js';

const getSelectedVariant = (product, size = '', color = '') => {
  if (!product.variants?.length) return null;
  return product.variants.find(
    (variant) =>
      variant.isActive &&
      variant.size === size &&
      variant.color === color
  ) || null;
};

const getSellingBasePrice = (product, variant = null) => {
  const regularPrice = variant?.basePrice ?? variant?.price ?? product.basePrice ?? product.price;
  if (variant?.baseDiscountPrice !== null && variant?.baseDiscountPrice !== undefined) {
    return variant.baseDiscountPrice;
  }
  if (variant?.basePrice !== null && variant?.basePrice !== undefined) return regularPrice;
  return product.baseDiscountPrice ?? product.discountPrice ?? regularPrice;
};

// Helper to format cart with fresh database prices and stock calculations
export const populateAndFormatCart = async (cart, suppliedSettings = null) => {
  let settings = suppliedSettings || await SiteSettings.findOne();
  if (!settings) settings = await SiteSettings.create({});
  await cart.populate({
    path: 'items.product',
    select: 'name slug price discountPrice basePrice baseDiscountPrice images stock isActive variants',
  });

  // Filter out any deleted or deactivated items if desired, but keep valid items
  let subtotal = 0;
  const items = [];

  for (const item of cart.items) {
    if (item.product && item.product.isActive) {
      const variant = getSelectedVariant(
        item.product,
        item.selectedSize || '',
        item.selectedColor || ''
      );
      const usesVariants = item.product.variants?.length > 0;
      const activePrice = await convertFromBase(getSellingBasePrice(item.product, variant), settings);
      const availableStock = usesVariants ? variant?.stock || 0 : item.product.stock;

      const itemTotal = activePrice * item.quantity;
      subtotal += itemTotal;

      items.push({
        _id: item._id,
        product: {
          _id: item.product._id,
          name: item.product.name,
          slug: item.product.slug,
          price: await convertFromBase(item.product.basePrice ?? item.product.price, settings),
          discountPrice: item.product.baseDiscountPrice === null || item.product.baseDiscountPrice === undefined ? null : await convertFromBase(item.product.baseDiscountPrice, settings),
          image: variant?.images?.[0] || item.product.images[0] || '',
          stock: availableStock,
          isOutOfStock: availableStock < item.quantity,
        },
        quantity: item.quantity,
        selectedSize: item.selectedSize || '',
        selectedColor: item.selectedColor || '',
        variantSku: variant?.sku || item.variantSku || '',
        unitPrice: activePrice,
        itemTotal,
      });
    }
  }

  return {
    _id: cart._id,
    user: cart.user,
    items,
    itemCount: items.reduce((acc, curr) => acc + curr.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
    currency: settings.commerce?.currencyCode || 'EUR',
  };
};

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const formattedCart = await populateAndFormatCart(cart);
    res.status(200).json({ success: true, cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, selectedSize = '', selectedColor = '' } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const qtyToAdd = Math.max(1, parseInt(quantity, 10));

    // 1. Fetch real product from DB
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }

    const normalizedSize = String(selectedSize || '').trim();
    const normalizedColor = String(selectedColor || '').trim();

    const selectedVariant = getSelectedVariant(product, normalizedSize, normalizedColor);
    if (product.variants?.length > 0 && !selectedVariant) {
      return res.status(400).json({
        success: false,
        message: 'This size and colour combination is unavailable',
      });
    }

    if (product.sizes?.length > 0 && !product.sizes.includes(normalizedSize)) {
      return res.status(400).json({
        success: false,
        message: normalizedSize ? 'The selected size is unavailable' : 'Please select a size',
      });
    }

    if (product.colors?.length > 0 && !product.colors.includes(normalizedColor)) {
      return res.status(400).json({
        success: false,
        message: normalizedColor ? 'The selected colour is unavailable' : 'Please select a colour',
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Match existing line by product and size/color variant
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.selectedSize || '') === normalizedSize &&
        (item.selectedColor || '') === normalizedColor
    );

    const existingVariantQty = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

    // 2. Validate against real stock
    if (existingVariantQty + qtyToAdd > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} item(s) are available for this selected variant.`,
      });
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += qtyToAdd;
    } else {
      cart.items.push({
        product: productId,
        quantity: qtyToAdd,
        selectedSize: normalizedSize,
        selectedColor: normalizedColor,
        variantSku: selectedVariant?.sku || '',
      });
    }

    await cart.save();
    const formattedCart = await populateAndFormatCart(cart);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: formattedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    // Check stock from DB
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product is no longer available' });
    }

    const selectedVariant = getSelectedVariant(
      product,
      item.selectedSize || '',
      item.selectedColor || ''
    );
    const availableStock = product.variants?.length > 0 ? selectedVariant?.stock || 0 : product.stock;

    if (quantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} item(s) are available for this selected variant`,
      });
    }

    item.quantity = quantity;
    await cart.save();

    const formattedCart = await populateAndFormatCart(cart);
    res.status(200).json({ success: true, message: 'Cart updated', cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    const formattedCart = await populateAndFormatCart(cart);
    res.status(200).json({ success: true, message: 'Item removed from cart', cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({ success: true, message: 'Cart cleared', cart: { items: [], itemCount: 0, subtotal: 0 } });
  } catch (error) {
    next(error);
  }
};
