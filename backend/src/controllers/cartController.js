import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';

// Helper to format cart with fresh database prices and stock calculations
export const populateAndFormatCart = async (cart) => {
  await cart.populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stock isActive',
  });

  // Filter out any deleted or deactivated items if desired, but keep valid items
  let subtotal = 0;
  const items = [];

  for (const item of cart.items) {
    if (item.product && item.product.isActive) {
      const activePrice =
        item.product.discountPrice !== null && item.product.discountPrice !== undefined
          ? item.product.discountPrice
          : item.product.price;

      const itemTotal = activePrice * item.quantity;
      subtotal += itemTotal;

      items.push({
        _id: item._id,
        product: {
          _id: item.product._id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          discountPrice: item.product.discountPrice,
          image: item.product.images[0] || '',
          stock: item.product.stock,
          isOutOfStock: item.product.stock < item.quantity,
        },
        quantity: item.quantity,
        selectedSize: item.selectedSize || 'M',
        selectedColor: item.selectedColor || '',
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
    const { productId, quantity = 1, selectedSize = 'M', selectedColor = '' } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const qtyToAdd = Math.max(1, parseInt(quantity, 10));

    // 1. Fetch real product from DB
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Match existing line by product and size/color variant
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.selectedSize || 'M') === selectedSize &&
        (item.selectedColor || '') === selectedColor
    );

    const totalProductQtyInCart = cart.items
      .filter((item) => item.product.toString() === productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    // 2. Validate against real stock
    if (totalProductQtyInCart + qtyToAdd > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock. You already have ${totalProductQtyInCart} in your cart.`,
      });
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += qtyToAdd;
    } else {
      cart.items.push({
        product: productId,
        quantity: qtyToAdd,
        selectedSize: selectedSize || 'M',
        selectedColor: selectedColor || '',
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

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
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
