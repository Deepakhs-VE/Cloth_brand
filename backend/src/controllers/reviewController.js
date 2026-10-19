import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (req, res, next) => {
  try {
    const { productId, rating, comment, images = [], fitFeedback = '', qualityRating = null } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed
    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product',
      });
    }

    // Check if user purchased the product
    const orderWithProduct = await Order.findOne({
      user: req.user._id,
      'orderItems.product': productId,
      orderStatus: 'DELIVERED',
    });

    if (!orderWithProduct) {
      return res.status(403).json({
        success: false,
        message: 'Reviews can be submitted after this product has been delivered to you',
      });
    }

    const isVerifiedPurchase = true;

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      comment,
      isApproved: true, // auto-approved or can be flagged by admin
      isVerifiedPurchase,
      images: Array.isArray(images) ? images.slice(0, 5) : [],
      fitFeedback,
      qualityRating: qualityRating ? Number(qualityRating) : null,
    });

    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleReviewHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || !review.isApproved) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    const userId = req.user._id.toString();
    const alreadyHelpful = review.helpfulBy.some((id) => id.toString() === userId);
    if (alreadyHelpful) review.helpfulBy.pull(req.user._id);
    else review.helpfulBy.addToSet(req.user._id);
    await review.save();
    res.status(200).json({ success: true, helpful: !alreadyHelpful, helpfulCount: review.helpfulBy.length });
  } catch (error) {
    next(error);
  }
};

export const reportReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    review.reportedBy.addToSet(req.user._id);
    await review.save();
    res.status(200).json({ success: true, message: 'Review reported for moderation' });
  } catch (error) {
    next(error);
  }
};

export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isApproved = Boolean(isApproved);
    await review.save();

    // Trigger recalculation of product ratings
    await Review.calcAverageRatings(review.product);

    res.status(200).json({
      success: true,
      message: `Review ${review.isApproved ? 'approved' : 'hidden'}`,
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const productId = review.product;
    await review.deleteOne();
    await Review.calcAverageRatings(productId);

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
