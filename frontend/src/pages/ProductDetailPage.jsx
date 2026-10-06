import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Minus,
  Plus,
  Star,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Ruler,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/common/StarRating';
import { ProductCard } from '../components/common/ProductCard';
import { Modal } from '../components/common/Modal';

// Sizing table data for garments
const sizeGuideData = {
  in: [
    { size: 'XS', chest: '34 - 36 in', waist: '28 - 30 in', hips: '35 - 37 in', length: '41.5 in' },
    { size: 'S', chest: '36 - 38 in', waist: '30 - 32 in', hips: '37 - 39 in', length: '42.5 in' },
    { size: 'M', chest: '38 - 40 in', waist: '32 - 34 in', hips: '39 - 41 in', length: '43.5 in' },
    { size: 'L', chest: '41 - 43 in', waist: '35 - 37 in', hips: '42 - 44 in', length: '44.5 in' },
    { size: 'XL', chest: '44 - 46 in', waist: '38 - 40 in', hips: '45 - 47 in', length: '45.5 in' },
  ],
  cm: [
    { size: 'XS', chest: '86 - 91 cm', waist: '71 - 76 cm', hips: '89 - 94 cm', length: '105 cm' },
    { size: 'S', chest: '91 - 97 cm', waist: '76 - 81 cm', hips: '94 - 99 cm', length: '108 cm' },
    { size: 'M', chest: '97 - 102 cm', waist: '81 - 86 cm', hips: '99 - 104 cm', length: '110 cm' },
    { size: 'L', chest: '104 - 109 cm', waist: '89 - 94 cm', hips: '107 - 112 cm', length: '113 cm' },
    { size: 'XL', chest: '112 - 117 cm', waist: '97 - 102 cm', hips: '114 - 119 cm', length: '116 cm' },
  ],
};

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, setCartDrawerOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);
  const [measurementUnit, setMeasurementUnit] = useState('in');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${slug}`);
        if (res.data.success) {
          const prod = res.data.product;
          setProduct(prod);
          setRelatedProducts(res.data.relatedProducts || []);
          setActiveImageIndex(0);
          if (prod.sizes && prod.sizes.length > 0) {
            setSelectedSize(prod.sizes[0]);
          } else {
            setSelectedSize('M');
          }
          if (prod.colors && prod.colors.length > 0) {
            setSelectedColor(prod.colors[0]);
          }

          // Fetch reviews for this product
          const revRes = await api.get(`/reviews/product/${prod._id}`);
          if (revRes.data.success) {
            setReviews(revRes.data.reviews || []);
          }
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The piece you requested does not exist or has been archived.</p>
        <Link to="/products" className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs uppercase tracking-wider font-bold">
          Return to Collection
        </Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product._id);
  const hasDiscount = product.discountPrice !== null && product.discountPrice !== undefined && product.discountPrice < product.price;
  const isOutOfStock = product.stock <= 0;
  const activePrice = hasDiscount ? product.discountPrice : product.price;

  const handleAddToCart = async () => {
    if (isOutOfStock || adding) return;
    setAdding(true);
    const result = await addToCart(product._id, quantity, selectedSize, selectedColor);
    setAdding(false);
    if (result?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCart(product._id, quantity, selectedSize, selectedColor);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await api.post('/reviews', {
        productId: product._id,
        rating: reviewRating,
        comment: reviewComment,
      });

      if (res.data.success) {
        setReviewSuccess('Thank you! Your review has been submitted.');
        setReviews([res.data.review, ...reviews]);
        setReviewComment('');
        setTimeout(() => setReviewModalOpen(false), 2000);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-slate-400 mb-8">
          <Link to="/" className="hover:text-slate-800 transition">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-slate-800 transition">Collection</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/products?category=${product.category.slug}`} className="hover:text-slate-800 transition">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Gallery View */}
          <div className="space-y-4">
            {/* Primary Main Image */}
            <div className="aspect-[4/5] bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md relative">
              <img
                src={product.images?.[activeImageIndex] || product.images?.[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-amber-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded shadow-sm">
                  Save ${(product.price - product.discountPrice).toFixed(0)}
                </span>
              )}
            </div>

            {/* Thumbnail Selectors */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                      activeImageIndex === idx ? 'border-slate-900 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Actions */}
          <div className="space-y-6">
            <div>
              {product.category?.name && (
                <p className="text-xs uppercase font-bold tracking-widest text-amber-600 mb-2">
                  {product.category.name}
                </p>
              )}
              <h1 className="font-luxury text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                {product.name}
              </h1>

              {/* Rating and Reviews */}
              <div className="flex items-center space-x-3">
                <StarRating rating={product.averageRating || 5} size="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-700">
                  {product.averageRating || 5.0}
                </span>
                <span className="text-xs text-slate-400">
                  ({reviews.length} reviews)
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-400">SKU: {product.sku || 'AUR-001'}</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline space-x-3 py-3 border-y border-slate-100">
              <span className="text-3xl font-extrabold text-slate-900">
                ${activePrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-slate-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Stock Availability */}
            <div>
              {isOutOfStock ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Currently Out of Stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  ⚠️ Limited Atelier Reserve — Only {product.stock} units remaining
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ In Stock Ready for Immediate Dispatch
                </span>
              )}
            </div>

            {/* Garment Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Colour: <span className="text-amber-800 font-semibold">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-1.5 text-xs rounded-lg font-medium border transition ${
                        selectedColor === color
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Garment Size Selection & Size Guide */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Garment Size: <span className="text-amber-700 font-extrabold">{selectedSize}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideModalOpen(true)}
                  className="inline-flex items-center text-xs font-medium text-amber-700 hover:text-amber-800 transition underline underline-offset-2"
                >
                  <Ruler className="w-3.5 h-3.5 mr-1" />
                  <span>Size Guide & Measurements</span>
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(product.sizes && product.sizes.length > 0
                  ? product.sizes
                  : ['XS', 'S', 'M', 'L', 'XL']
                ).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-2.5 text-xs font-bold rounded-xl border text-center transition ${
                      selectedSize === size
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper & CTAs */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="p-2.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Wishlist toggle */}
                <button
                  onClick={() => toggleWishlist(product._id)}
                  className={`p-3 rounded-xl border transition ${
                    isWishlisted
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || adding}
                  className={`w-full py-4 px-6 text-xs uppercase tracking-widest font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-md ${
                    isOutOfStock
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Bag</span>
                    </>
                  ) : adding ? (
                    <span>Adding to Bag...</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="w-full py-4 px-6 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition shadow-md flex items-center justify-center space-x-2"
                >
                  <span>Buy It Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Service badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Complimentary Delivery &gt; $150</span>
              </div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>30-Day Effortless Returns</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Certificate of Authenticity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Extended Details */}
        <div className="mt-20 pt-12 border-t border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-luxury text-2xl font-bold text-slate-900">
                Artisan Story & Details
              </h2>
              <div className="prose prose-slate text-sm leading-relaxed text-slate-600 space-y-4">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Specifications Box */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                  Bespoke Specifications
                </h3>
                <dl className="divide-y divide-slate-100 text-xs">
                  {product.specifications.map((spec, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between">
                      <dt className="text-slate-500 font-medium">{spec.key}</dt>
                      <dd className="text-slate-900 font-semibold text-right">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-20 pt-12 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="font-luxury text-2xl sm:text-3xl font-bold text-slate-900">
                Verified Client Reviews
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Authentic evaluations from verified patrons
              </p>
            </div>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                } else {
                  setReviewModalOpen(true);
                }
              }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-300 hover:border-slate-900 text-slate-800 text-xs uppercase tracking-wider font-semibold rounded-xl shadow-sm transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>

          {/* Reviews list */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        {rev.user?.name?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{rev.user?.name || 'Verified Patron'}</h4>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <StarRating rating={rev.rating} size="w-3 h-3" />
                          {rev.isVerifiedPurchase && (
                            <span className="flex items-center text-[10px] text-emerald-600 font-semibold ml-2">
                              <CheckCircle className="w-3 h-3 mr-0.5" /> Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-12">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-600 mb-2">Be the first to review this masterwork.</p>
              <p className="text-xs text-slate-400">Share your experience with fellow collectors worldwide.</p>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-slate-200">
            <h2 className="font-luxury text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
              You May Also Appreciate
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel._id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Share Your Impression"
      >
        {reviewSuccess ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900">{reviewSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            {reviewError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                {reviewError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Your Rating
              </label>
              <StarRating
                rating={reviewRating}
                interactive={true}
                onRate={(r) => setReviewRating(r)}
                size="w-6 h-6"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Your Review Comment
              </label>
              <textarea
                rows={4}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Describe the build quality, tactile feel, and your satisfaction..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition disabled:opacity-50"
            >
              {reviewSubmitting ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </form>
        )}
      </Modal>

      {/* Atelier Size Guide & Measurements Modal */}
      <Modal
        isOpen={sizeGuideModalOpen}
        onClose={() => setSizeGuideModalOpen(false)}
        title="Atelier Garment Sizing & Tailoring Guide"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <p className="text-xs text-slate-500">
              Garment sizing conforms to international tailoring dimensions.
            </p>
            {/* Unit Switcher */}
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMeasurementUnit('in')}
                className={`px-3 py-1 rounded-md transition ${
                  measurementUnit === 'in'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setMeasurementUnit('cm')}
                className={`px-3 py-1 rounded-md transition ${
                  measurementUnit === 'cm'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Measurement Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Chest / Bust</th>
                  <th className="py-3 px-4">Waist</th>
                  <th className="py-3 px-4">Hips</th>
                  <th className="py-3 px-4">Garment Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {sizeGuideData[measurementUnit].map((row) => (
                  <tr
                    key={row.size}
                    className={
                      selectedSize === row.size
                        ? 'bg-amber-50/70 font-bold text-slate-900'
                        : 'hover:bg-slate-50/50'
                    }
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.size}
                      {selectedSize === row.size && (
                        <span className="ml-1.5 text-[10px] text-amber-700 font-normal">
                          (Selected)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{row.chest}</td>
                    <td className="py-3 px-4">{row.waist}</td>
                    <td className="py-3 px-4">{row.hips}</td>
                    <td className="py-3 px-4">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tailoring & Fit Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 mb-1">How to Measure</h4>
              <p className="text-slate-500 leading-relaxed">
                Measure chest/bust at fullest circumference. Measure natural waist at narrowest point. Hips approx. 20cm below waistline.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Complimentary Atelier Tailoring</h4>
              <p className="text-slate-500 leading-relaxed">
                All garments qualify for complimentary hem sleeve or inseam adjustments. Contact our WhatsApp concierge prior to dispatch.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
