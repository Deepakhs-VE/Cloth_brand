import { Wishlist } from '../models/Wishlist.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { populateAndFormatCart } from './cartController.js';

export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      select: 'name slug price discountPrice images stock isActive averageRating numReviews',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({ success: true, count: wishlist.products.length, wishlist: wishlist.products });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.findIndex((id) => id.toString() === productId);
    let isAdded = false;

    if (index > -1) {
      wishlist.products.splice(index, 1);
      isAdded = false;
    } else {
      wishlist.products.push(productId);
      isAdded = true;
    }

    await wishlist.save();
    await wishlist.populate({
      path: 'products',
      select: 'name slug price discountPrice images stock isActive averageRating numReviews',
    });

    res.status(200).json({
      success: true,
      message: isAdded ? 'Product added to wishlist' : 'Product removed from wishlist',
      isWishlisted: isAdded,
      wishlist: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (wishlist) {
      wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
      await wishlist.save();
    }

    res.status(200).json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

export const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product || !product.isActive || product.stock < 1) {
      return res.status(400).json({ success: false, message: 'Product is unavailable or out of stock' });
    }

    // Remove from wishlist
    await Wishlist.updateOne(
      { user: req.user._id },
      { $pull: { products: productId } }
    );

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += 1;
    } else {
      cart.items.push({ product: productId, quantity: 1 });
    }

    await cart.save();
    const formattedCart = await populateAndFormatCart(cart);

    res.status(200).json({
      success: true,
      message: 'Product moved to cart',
      cart: formattedCart,
    });
  } catch (error) {
    next(error);
  }
};
