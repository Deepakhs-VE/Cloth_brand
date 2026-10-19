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
  ChevronLeft,
  ChevronRight,
  Ruler,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/common/StarRating';
import { ProductCard } from '../components/common/ProductCard';
import { Modal } from '../components/common/Modal';
import { useCurrency } from '../hooks/useCurrency';
import { ImageUpload } from '../components/common/ImageUpload';
import { SelectDropdown } from '../components/common/SelectDropdown';
import { europeanCountryOptions } from '../utils/europeanCountries';

// Inches are the canonical tailoring measurements. Centimeters are generated
// from these values so both unit views always remain mathematically consistent.
const alphaSizeGuide = [
  { size: 'XS', chest: [34, 36], waist: [28, 30], hips: [35, 37], length: 41.5 },
  { size: 'S', chest: [36, 38], waist: [30, 32], hips: [37, 39], length: 42.5 },
  { size: 'M', chest: [38, 40], waist: [32, 34], hips: [39, 41], length: 43.5 },
  { size: 'L', chest: [41, 43], waist: [35, 37], hips: [42, 44], length: 44.5 },
  { size: 'XL', chest: [44, 46], waist: [38, 40], hips: [45, 47], length: 45.5 },
];

const sizeGuideConfigs = {
  alpha: {
    description: 'Body measurements for standard apparel sizing.',
    columns: [
      { key: 'chest', label: 'Chest' },
      { key: 'waist', label: 'Waist' },
      { key: 'hips', label: 'Hips' },
      { key: 'length', label: 'Length' },
    ],
    rows: alphaSizeGuide,
  },
  waist: {
    description: 'Body waist and hip measurements for jeans and trousers.',
    columns: [
      { key: 'waist', label: 'Waist' },
      { key: 'hips', label: 'Hips' },
      { key: 'inseam', label: 'Inseam' },
    ],
    rows: [26, 28, 30, 32, 34, 36, 38, 40].map((size) => ({
      size: String(size),
      waist: [size, size + 1],
      hips: [size + 8, size + 10],
      inseam: 32,
    })),
  },
  shoe: {
    description: 'Foot measurements for footwear sizing. Measure heel to longest toe.',
    columns: [
      { key: 'footLength', label: 'Foot length' },
    ],
    rows: [
      { size: '5', footLength: 9.1 }, { size: '6', footLength: 9.3 },
      { size: '7', footLength: 9.6 }, { size: '8', footLength: 9.8 },
      { size: '9', footLength: 10.1 }, { size: '10', footLength: 10.3 },
      { size: '11', footLength: 10.6 }, { size: '12', footLength: 10.8 },
    ],
  },
  one_size: {
    description: 'This design is offered in one adaptable size. Review product specifications for its construction.',
    columns: [],
    rows: [{ size: 'One Size' }],
  },
};

const formatMeasurement = (value, unit, sourceUnit = 'in') => {
  const convert = (measurement) => {
    if (unit === sourceUnit) return Math.round(measurement * 10) / 10;
    return unit === 'cm'
      ? Math.round(measurement * 2.54 * 10) / 10
      : Math.round((measurement / 2.54) * 10) / 10;
  };
  const suffix = unit === 'cm' ? 'cm' : 'in';

  if (Array.isArray(value)) {
    return `${convert(value[0])}–${convert(value[1])} ${suffix}`;
  }
  return `${convert(value)} ${suffix}`;
};

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, setCartDrawerOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const { formatMoney, currency, commerce } = useCurrency();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);
  const [measurementUnit, setMeasurementUnit] = useState('in');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [deliveryCountry, setDeliveryCountry] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [deliveryChecking, setDeliveryChecking] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewFit, setReviewFit] = useState('');
  const [reviewQuality, setReviewQuality] = useState(5);
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
          const activeVariants = (prod.variants || []).filter((variant) => variant.isActive !== false);
          const initialVariant = activeVariants.find((variant) => variant.stock > 0) || activeVariants[0];
          if (initialVariant) {
            setSelectedSize(initialVariant.size || '');
            setSelectedColor(initialVariant.color || '');
            setActiveImageIndex(0);
          } else if (prod.sizes && prod.sizes.length > 0) {
            setSelectedSize(prod.sizes[0]);
          } else {
            setSelectedSize('');
          }
          if (!initialVariant && prod.colors && prod.colors.length > 0) {
            setSelectedColor(prod.colors[0]);
          } else if (!initialVariant) {
            setSelectedColor('');
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

  // Advance the main image and keep the thumbnail strip aligned below it.
  // The gallery resets whenever the customer chooses a different colour.
  useEffect(() => {
    if (!product) return undefined;
    const activeVariants = (product.variants || []).filter((variant) => variant.isActive !== false);
    const colourImages = activeVariants.length
      ? [...new Set(activeVariants.filter((variant) => variant.color === selectedColor).flatMap((variant) => variant.images || []).filter(Boolean))]
      : [];
    const images = [...new Set([...colourImages, ...(product.images || [])])];
    if (images.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveImageIndex((index) => (index + 1) % images.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [product, selectedColor]);

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
  const activeVariants = (product.variants || []).filter((variant) => variant.isActive !== false);
  const selectedVariant = activeVariants.find(
    (variant) => variant.size === selectedSize && variant.color === selectedColor
  );
  const availableColors = activeVariants.length
    ? [...new Set(activeVariants.map((variant) => variant.color).filter(Boolean))]
    : product.colors || [];
  const availableSizes = activeVariants.length
    ? [...new Set(
        activeVariants
          .filter((variant) =>
            (!availableColors.length || variant.color === selectedColor) && variant.stock > 0
          )
          .map((variant) => variant.size)
          .filter(Boolean)
      )]
    : product.sizes || [];
  const selectableColors = activeVariants.length && selectedSize
    ? availableColors.filter((color) => activeVariants.some(
        (variant) => variant.color === color && variant.size === selectedSize && variant.stock > 0
      ))
    : availableColors;
  const colorGalleryImages = activeVariants.length
    ? [...new Set(
        activeVariants
          .filter((variant) => variant.color === selectedColor)
          .flatMap((variant) => variant.images || [])
          .filter(Boolean)
      )]
    : [];
  // Keep the selected colour's images first, then show every remaining product
  // image beneath the main photo so customers can browse the complete gallery.
  const galleryImages = [...new Set([...colorGalleryImages, ...(product.images || [])])];
  const displayGalleryImages = galleryImages.length ? galleryImages : ['/image-placeholder.svg'];
  const currentImageIndex = Math.min(activeImageIndex, displayGalleryImages.length - 1);
  const moveGallery = (direction) => {
    setActiveImageIndex((currentIndex) =>
      (currentIndex + direction + displayGalleryImages.length) % displayGalleryImages.length
    );
  };
  const selectedStock = activeVariants.length ? selectedVariant?.stock || 0 : product.stock;
  const regularPrice = selectedVariant?.price ?? product.price;
  const discountPrice = selectedVariant?.discountPrice !== null && selectedVariant?.discountPrice !== undefined
    ? selectedVariant.discountPrice
    : selectedVariant?.price !== null && selectedVariant?.price !== undefined
    ? null
    : product.discountPrice;
  const hasDiscount = discountPrice !== null && discountPrice !== undefined && discountPrice < regularPrice;
  const isOutOfStock = selectedStock <= 0;
  const activePrice = hasDiscount ? discountPrice : regularPrice;
  const configuredSizeGuide = product.sizeChart?.rows?.length > 0
    ? {
        description: `${product.sizeChart.measurementType === 'garment' ? 'Garment' : 'Body'} measurements supplied for this product.`,
        sourceUnit: product.sizeChart.unit || 'cm',
        columns: (product.sizeChart.columns || []).map((column) => ({ key: column, label: column })),
        rows: product.sizeChart.rows.map((row) => ({
          size: row.size,
          ...Object.fromEntries((row.measurements || []).map((measurement) => [measurement.key, measurement.value])),
        })),
      }
    : null;
  const sizeGuide = configuredSizeGuide || { ...(sizeGuideConfigs[product.sizeSystem] || sizeGuideConfigs.alpha), sourceUnit: 'in' };

  const checkDelivery = async () => {
    if (!deliveryCountry.trim() || !deliveryPostalCode.trim()) return;
    setDeliveryChecking(true);
    try {
      const response = await api.post('/settings/delivery-quote', {
        country: deliveryCountry,
        postalCode: deliveryPostalCode,
        subtotal: activePrice,
      });
      setDeliveryQuote(response.data);
    } catch (error) {
      setDeliveryQuote({ serviceable: false, message: error.response?.data?.message || 'Unable to check delivery right now' });
    } finally {
      setDeliveryChecking(false);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (activeVariants.length) {
      const matchingVariants = activeVariants.filter((variant) => variant.color === color);
      const preservedSizeVariant = matchingVariants.find(
        (variant) => variant.size === selectedSize && variant.stock > 0
      );
      const nextVariant = preservedSizeVariant
        || matchingVariants.find((variant) => variant.stock > 0)
        || matchingVariants[0];
      setSelectedSize(nextVariant?.size || '');
      setActiveImageIndex(0);
      setQuantity(1);
    }
  };

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
        images: reviewImages,
        fitFeedback: reviewFit,
        qualityRating: reviewQuality,
      });

      if (res.data.success) {
        setReviewSuccess('Thank you! Your review has been submitted.');
        setReviews([res.data.review, ...reviews]);
        setReviewComment('');
        setReviewImages([]);
        setReviewFit('');
        setTimeout(() => setReviewModalOpen(false), 2000);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const toggleHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      const response = await api.patch(`/reviews/${reviewId}/helpful`);
      setReviews((current) => current.map((review) => review._id === reviewId
        ? { ...review, helpfulBy: Array.from({ length: response.data.helpfulCount }, (_, index) => index) }
        : review));
    } catch (error) {
      console.error('Could not update helpful vote:', error);
    }
  };

  const reportReview = async (reviewId) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      await api.post(`/reviews/${reviewId}/report`);
    } catch (error) {
      console.error('Could not report review:', error);
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
              <div
                className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {displayGalleryImages.map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`${product.name} — view ${index + 1}`}
                    className="h-full w-full shrink-0 object-cover object-center"
                  />
                ))}
              </div>
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-amber-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded shadow-sm">
                  Save {formatMoney(regularPrice - discountPrice)}
                </span>
              )}
              {displayGalleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveGallery(-1)}
                    aria-label="Previous product image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-sm transition hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGallery(1)}
                    aria-label="Next product image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-sm transition hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Selectors */}
            {displayGalleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 pr-2 [scrollbar-width:thin]">
                {displayGalleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                      currentImageIndex === idx ? 'border-slate-900 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
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
                <StarRating rating={product.averageRating || 0} size="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-700">
                  {product.numReviews > 0 ? Number(product.averageRating || 0).toFixed(1) : 'Not yet rated'}
                </span>
                <span className="text-xs text-slate-400">
                  ({reviews.length} reviews)
                </span>
                {(selectedVariant?.sku || product.sku) && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">SKU: {selectedVariant?.sku || product.sku}</span>
                  </>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline space-x-3 py-3 border-y border-slate-100">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatMoney(activePrice)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-slate-400 line-through">
                  {formatMoney(regularPrice)}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {Math.round(((regularPrice - discountPrice) / regularPrice) * 100)}% off
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
              ) : selectedStock <= 5 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  Limited availability — only {selectedStock} unit(s) in this selection
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ In Stock Ready for Immediate Dispatch
                </span>
              )}
            </div>

            {/* Garment Color Selection */}
            {availableColors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Colour: <span className="text-amber-800 font-semibold">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectableColors.map((color) => {
                    const swatch = product.colorOptions?.find((option) => option.name === color);
                    return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`px-3.5 py-1.5 text-xs rounded-lg font-medium border transition ${
                        selectedColor === color
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ backgroundColor: swatch?.hex || '#CBD5E1', backgroundImage: swatch?.swatchImage ? `url(${swatch.swatchImage})` : undefined, backgroundSize: 'cover' }} />
                        {color}
                      </span>
                    </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Garment Size Selection & Size Guide */}
            {availableSizes.length > 0 && <div className="space-y-2 pt-2 border-t border-slate-100">
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
                {availableSizes.map((size) => {
                  const sizeVariant = activeVariants.find(
                    (variant) => variant.color === selectedColor && variant.size === size
                  );
                  const sizeOutOfStock = activeVariants.length > 0 && (!sizeVariant || sizeVariant.stock <= 0);
                  return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setQuantity(1);
                    }}
                    disabled={sizeOutOfStock}
                    className={`py-2.5 text-xs font-bold rounded-xl border text-center transition ${
                      selectedSize === size
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : sizeOutOfStock
                        ? 'border-slate-200 bg-slate-50 text-slate-400 line-through cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {size}
                  </button>
                  );
                })}
              </div>
            </div>}

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
                    onClick={() => setQuantity(Math.min(selectedStock, quantity + 1))}
                    disabled={quantity >= selectedStock || isOutOfStock}
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
                <span>Complimentary Delivery &gt; {formatMoney(commerce.freeShippingThreshold ?? 150)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>{product.returnPolicy?.finalSale ? 'Final sale item' : product.returnPolicy?.returnable === false ? 'Exchange only' : `${product.returnPolicy?.returnWindowDays ?? commerce.defaultReturnWindowDays ?? 30}-Day Returns`}</span>
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
            {(product.fit || product.fabric || product.garmentType || product.specifications?.length > 0) && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                  Bespoke Specifications
                </h3>
                <dl className="divide-y divide-slate-100 text-xs">
                  {product.garmentType && (
                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500 font-medium">Garment type</dt>
                      <dd className="text-slate-900 font-semibold text-right">{product.garmentType}</dd>
                    </div>
                  )}
                  {product.fit && (
                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500 font-medium">Fit</dt>
                      <dd className="text-slate-900 font-semibold text-right capitalize">{product.fit}</dd>
                    </div>
                  )}
                  {product.fabric && (
                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500 font-medium">Fabric</dt>
                      <dd className="text-slate-900 font-semibold text-right">{product.fabric}</dd>
                    </div>
                  )}
                  {Object.entries(product.fashionDetails || {}).filter(([, value]) => value).map(([key, value]) => (
                    <div key={key} className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="text-slate-900 font-semibold text-right">{value}</dd>
                    </div>
                  ))}
                  {(product.specifications || []).map((spec, idx) => (
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
                  {(rev.fitFeedback || rev.qualityRating) && (
                    <div className="mt-3 ml-12 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600">
                      {rev.fitFeedback && <span className="rounded-full bg-slate-100 px-2.5 py-1">Fit: {rev.fitFeedback}</span>}
                      {rev.qualityRating && <span className="rounded-full bg-slate-100 px-2.5 py-1">Quality: {rev.qualityRating}/5</span>}
                    </div>
                  )}
                  {rev.images?.length > 0 && (
                    <div className="mt-4 ml-12 flex flex-wrap gap-2">
                      {rev.images.map((image, index) => (
                        <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                          <img src={image} alt={`Customer review ${index + 1}`} className="h-20 w-20 object-cover" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 ml-12 flex items-center gap-4 text-[10px] font-semibold text-slate-500">
                    <button type="button" onClick={() => toggleHelpful(rev._id)} className="hover:text-slate-900">
                      Helpful ({rev.helpfulBy?.length || 0})
                    </button>
                    <button type="button" onClick={() => reportReview(rev._id)} className="hover:text-rose-700">Report</button>
                  </div>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">How did it fit?</label>
                <select value={reviewFit} onChange={(event) => setReviewFit(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <option value="">Not specified</option>
                  <option value="Runs small">Runs small</option>
                  <option value="True to size">True to size</option>
                  <option value="Runs large">Runs large</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Quality rating</label>
                <select value={reviewQuality} onChange={(event) => setReviewQuality(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                </select>
              </div>
            </div>

            <ImageUpload
              label="Customer photos (optional)"
              value={reviewImages}
              onChange={setReviewImages}
              purpose="reviews"
              multiple
              maxFiles={5}
              aspectClass="aspect-square"
            />

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
        title="Size Guide & Measurements"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <p className="text-xs text-slate-500">
              {sizeGuide.description}
            </p>
            {/* Unit Switcher */}
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMeasurementUnit('in')}
                aria-pressed={measurementUnit === 'in'}
                className={`px-3 py-1.5 rounded-md transition ${
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
                aria-pressed={measurementUnit === 'cm'}
                className={`px-3 py-1.5 rounded-md transition ${
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
                  <th className="py-2.5 px-3">Size</th>
                  {sizeGuide.columns.map((column) => (
                    <th key={column.key} className="py-2.5 px-3">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody key={measurementUnit} className="divide-y divide-slate-100 font-medium text-slate-600 animate-fade-in">
                {sizeGuide.rows.map((row) => (
                  <tr
                    key={row.size}
                    className={
                      selectedSize === row.size
                        ? 'bg-amber-50/70 font-bold text-slate-900'
                        : 'hover:bg-slate-50/50'
                    }
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {row.size}
                      {selectedSize === row.size && (
                        <span className="ml-1.5 text-[10px] text-amber-700 font-normal">
                          (Selected)
                        </span>
                      )}
                    </td>
                    {sizeGuide.columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap py-2.5 px-3">
                        {row[column.key] !== undefined ? formatMeasurement(row[column.key], measurementUnit, sizeGuide.sourceUnit) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tailoring & Fit Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 mb-1">How to Measure</h4>
              <p className="text-slate-500 leading-relaxed">
                Measure the chest at its fullest point and the natural waist at its narrowest. Measure hips approximately {measurementUnit === 'cm' ? '20 cm' : '8 in'} below the waistline.
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
