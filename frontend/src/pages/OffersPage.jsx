import React, { useEffect, useState } from 'react';
import { Tag, Copy, Check, Clock, Sparkles } from 'lucide-react';
import api from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const OffersPage = () => {
  const [coupons, setCoupons] = useState([
    {
      code: 'LUXE2026',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 100,
      description: 'Enjoy 20% off all orders over $100 with complimentary express courier delivery.',
    },
    {
      code: 'FIRST10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 50,
      description: 'Welcome privilege: 10% off your initial bespoke purchase.',
    },
    {
      code: 'SPRING50',
      discountType: 'fixed',
      discountValue: 50,
      minOrderAmount: 250,
      description: 'Receive $50 complimentary savings on all orders exceeding $250.',
    },
  ]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.get('/products?limit=8');
        if (res.data.success) {
          // Filter products with discountPrice
          const discounted = res.data.products.filter(
            (p) => p.discountPrice !== null && p.discountPrice < p.price
          );
          setDiscountedProducts(discounted.length > 0 ? discounted : res.data.products);
        }
      } catch (err) {
        console.error('Error fetching offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs uppercase font-bold tracking-widest text-amber-600 mb-2 bg-amber-50 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seasonal Privileges</span>
          </div>
          <h1 className="font-luxury text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Special Offers & Promotions
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Apply privileged discount codes at checkout to unlock savings on exceptional creations.
          </p>
        </div>

        {/* Coupon Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {coupons.map((c) => (
            <div
              key={c.code}
              className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-6 -mt-6 pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-slate-900">
                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`}
                  </span>
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {c.description}
                </p>

                <div className="text-[11px] text-slate-400 space-y-1 mb-6">
                  <p>• Minimum spend: ${c.minOrderAmount}</p>
                  <p>• Unlimited authentic warranty included</p>
                </div>
              </div>

              {/* Code Box */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300">
                <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                  {c.code}
                </span>
                <button
                  onClick={() => handleCopy(c.code)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  {copiedCode === c.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Discounted Creations */}
        <div>
          <div className="text-center mb-12">
            <h2 className="font-luxury text-2xl sm:text-3xl font-bold text-slate-900">
              Creations with Preferred Pricing
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Curated masterworks with exclusive limited-time price reductions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {discountedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
