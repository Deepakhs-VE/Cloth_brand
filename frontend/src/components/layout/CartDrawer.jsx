import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartDrawer = () => {
  const { cart, cartDrawerOpen, setCartDrawerOpen, updateQuantity, removeItem, loading } = useCart();

  if (!cartDrawerOpen) return null;

  const freeShippingThreshold = 150;
  const progressPercent = Math.min(100, ((cart.subtotal || 0) / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - (cart.subtotal || 0));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-5 h-5 text-slate-800" />
              <h2 className="text-lg font-semibold tracking-wide text-slate-900">Your Shopping Bag</h2>
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {cart.itemCount || 0}
              </span>
            </div>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 transition"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Bar */}
          <div className="bg-amber-50/70 border-b border-amber-100/60 px-6 py-3">
            <div className="flex justify-between text-xs font-medium text-amber-900 mb-1.5">
              <span>
                {remainingForFreeShipping > 0
                  ? `Add $${remainingForFreeShipping.toFixed(2)} more for Free Express Delivery`
                  : '🎉 Congratulations! You have unlocked Free Express Delivery'}
              </span>
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.items && cart.items.length > 0 ? (
              cart.items.map((item) => (
                <div
                  key={item._id}
                  className="flex space-x-4 pb-4 border-b border-slate-100 last:border-0"
                >
                  <img
                    src={item.product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
                    alt={item.product?.name}
                    className="w-20 h-20 object-cover rounded-lg border border-slate-100 bg-slate-50 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product?.slug}`}
                      onClick={() => setCartDrawerOpen(false)}
                      className="text-sm font-medium text-slate-900 hover:text-amber-700 line-clamp-1 transition"
                    >
                      {item.product?.name}
                    </Link>

                    {/* Garment Variant Badges */}
                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        Size: {item.selectedSize || 'M'}
                      </span>
                      {item.selectedColor && (
                        <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                          • {item.selectedColor}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      ${item.unitPrice?.toFixed(2)}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-md">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item._id, item.quantity - 1);
                            } else {
                              removeItem(item._id);
                            }
                          }}
                          className="p-1 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Your bag is empty</h3>
                <p className="text-sm text-slate-500 mb-6">Explore our curated collection to add timeless items.</p>
                <Link
                  to="/products"
                  onClick={() => setCartDrawerOpen(false)}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white text-xs uppercase tracking-widest font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm"
                >
                  Start Exploring
                </Link>
              </div>
            )}
          </div>

          {/* Footer / Checkout */}
          {cart.items && cart.items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center text-base font-medium text-slate-900">
                <span>Subtotal</span>
                <span className="font-bold text-lg">${cart.subtotal?.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500">Taxes and shipping calculated at checkout.</p>

              <div className="space-y-2">
                <Link
                  to="/checkout"
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm tracking-wide rounded-lg flex items-center justify-center space-x-2 transition shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full py-2.5 px-6 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition"
                >
                  View Full Cart
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
