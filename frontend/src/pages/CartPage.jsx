import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { EmptyState } from '../components/common/EmptyState';

export const CartPage = () => {
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();

  const freeShippingThreshold = 150;
  const progressPercent = Math.min(100, ((cart.subtotal || 0) / freeShippingThreshold) * 100);
  const remainingForFree = Math.max(0, freeShippingThreshold - (cart.subtotal || 0));

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 bg-[#fcfbfa]">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Bag is Empty"
          description="You haven't added any bespoke items to your bag yet. Explore our curated catalog to begin."
          actionText="Explore Collection"
          actionLink="/products"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-8 border-b border-slate-200">
          <h1 className="font-luxury text-3xl font-extrabold text-slate-900">
            Shopping Bag ({cart.itemCount})
          </h1>
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
          >
            Clear Entire Bag
          </button>
        </div>

        {/* Free Shipping Alert */}
        <div className="mt-6 bg-amber-50 border border-amber-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-2">
            <span>
              {remainingForFree > 0
                ? `Add $${remainingForFree.toFixed(2)} more to qualify for Free Global Express Courier`
                : '🎉 Complimentary Global Express Delivery Qualified!'}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-amber-200/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item._id}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
                    alt={item.product?.name}
                    className="w-20 h-20 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                  />
                  <div>
                    <Link
                      to={`/products/${item.product?.slug}`}
                      className="text-sm font-bold text-slate-900 hover:text-amber-700 transition line-clamp-1"
                    >
                      {item.product?.name}
                    </Link>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        Size: {item.selectedSize || 'M'}
                      </span>
                      {item.selectedColor && (
                        <span className="text-[11px] text-slate-500">
                          Color: {item.selectedColor}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Unit Price: ${item.unitPrice?.toFixed(2)}
                    </p>
                    {item.product?.stock <= 5 && (
                      <p className="text-[11px] text-orange-600 font-semibold mt-1">
                        Only {item.product.stock} units remaining
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-8">
                  {/* Quantity */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateQuantity(item._id, item.quantity - 1);
                        } else {
                          removeItem(item._id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-slate-900"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="p-2 text-slate-500 hover:text-slate-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-base font-extrabold text-slate-900">
                      ${item.itemTotal?.toFixed(2)}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item._id)}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 sticky top-28">
              <h2 className="font-luxury text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-slate-900">${cart.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Courier Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {cart.subtotal >= 150 ? 'FREE' : '$15.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="text-slate-400">Calculated at checkout</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Estimated Total</span>
                <span className="font-luxury text-2xl font-extrabold text-slate-900">
                  ${(cart.subtotal + (cart.subtotal >= 150 ? 0 : 15)).toFixed(2)}
                </span>
              </div>

              <Link
                to="/checkout"
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="pt-2 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>256-Bit Encrypted Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
