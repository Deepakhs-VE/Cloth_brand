import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { EmptyState } from '../components/common/EmptyState';
import { getProductPath } from '../utils/productPath';

export const WishlistPage = () => {
  const { wishlist, removeFromWishlist, moveToCart, loading } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 bg-[#fcfbfa]">
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Save creations you admire to review later or acquire when ready."
          actionText="Explore Collection"
          actionLink="/products"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="pb-6 border-b border-slate-200">
          <h1 className="font-luxury text-3xl font-extrabold text-slate-900">
            Saved Creations ({wishlist.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal private selection of timepieces, leather goods, and acoustics
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;
            const activePrice = hasDiscount ? product.discountPrice : product.price;
            const isOutOfStock = product.stock <= 0;
            const productPath = getProductPath(product);

            return (
              <div
                key={product._id}
                className="motion-card group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-[4/5] bg-slate-100">
                  <Link to={productPath} className="block h-full overflow-hidden">
                    <img
                      src={product.images?.[0] || '/image-placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(product._id)}
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-rose-600 shadow-sm transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                      <Link to={productPath} className="hover:text-amber-700 transition">
                        {product.name}
                      </Link>
                    </h3>
                    <div className="flex items-baseline space-x-2 mb-4">
                      <span className="font-extrabold text-base text-slate-900">
                        ${activePrice.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link
                      to={productPath}
                      className="flex w-full items-center justify-center space-x-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span>View Product</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => moveToCart(product._id)}
                      disabled={isOutOfStock}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs uppercase tracking-wider font-bold rounded-xl transition flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Move to Bag'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
