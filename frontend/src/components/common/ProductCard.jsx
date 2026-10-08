import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Check } from 'lucide-react';
import { StarRating } from './StarRating';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isWishlisted = isInWishlist(product._id);
  const hasDiscount = product.discountPrice !== null && product.discountPrice !== undefined && product.discountPrice < product.price;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (isOutOfStock || adding) return;

    setAdding(true);
    const result = await addToCart(product._id, 1);
    setAdding(false);

    if (result?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    await toggleWishlist(product._id);
  };

  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="motion-card group relative bg-white rounded-2xl overflow-hidden border border-slate-100/80 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <Link to={`/products/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images?.[0] || '/image-placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              Featured
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              Only {product.stock} Left
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 shadow-md scale-110'
              : 'bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 stroke-rose-600' : 'stroke-[2]'}`}
          />
        </button>

        {/* Quick Add Overlay on hover (Desktop) */}
        <div className="absolute inset-x-3 bottom-3 hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className={`w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2 shadow-lg ${
              isOutOfStock
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900/90 backdrop-blur-md hover:bg-slate-950 text-white'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added to Bag</span>
              </>
            ) : adding ? (
              <span>Adding...</span>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        {product.category?.name && (
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
            {product.category.name}
          </p>
        )}

        {/* Title */}
        <h3 className="text-sm font-medium text-slate-900 group-hover:text-amber-700 line-clamp-1 transition mb-1">
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Rating */}
        <div className="flex items-center space-x-1.5 mb-2">
          <StarRating rating={product.averageRating || 5} size="w-3 h-3" />
          <span className="text-[11px] text-slate-400">({product.numReviews || 0})</span>
        </div>

        {/* Price & Mobile Add to Cart */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-50">
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-bold text-slate-900">
              ${(product.discountPrice || product.price).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Mobile direct add button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="lg:hidden p-2 text-slate-800 hover:text-slate-950 bg-slate-100 rounded-lg"
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
