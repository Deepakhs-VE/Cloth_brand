import React, { useEffect, useState } from 'react';
import { Tag, Copy, Check, Clock, Sparkles } from 'lucide-react';
import api from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const OffersPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setCouponError('');

      const [couponResult, productResult] = await Promise.allSettled([
        api.get('/coupons/public'),
        api.get('/products?limit=8'),
      ]);

      if (couponResult.status === 'fulfilled' && couponResult.value.data.success) {
        setCoupons(couponResult.value.data.coupons || []);
      } else {
        console.error(
          'Error fetching coupons:',
          couponResult.status === 'rejected' ? couponResult.reason : couponResult.value.data
        );
        setCouponError('Offers are temporarily unavailable. Please try again shortly.');
      }

      if (productResult.status === 'fulfilled') {
        const res = productResult.value;
        if (res.data.success) {
          // Filter products with discountPrice
          const discounted = res.data.products.filter(
            (p) => p.discountPrice !== null && p.discountPrice < p.price
          );
          setDiscountedProducts(discounted.length > 0 ? discounted : res.data.products);
        }
      } else {
        console.error('Error fetching discounted products:', productResult.reason);
      }

      setLoading(false);
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
        {couponError && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm text-amber-800">
            {couponError}
          </div>
        )}

        {!loading && !couponError && coupons.length === 0 && (
          <div className="mb-12 rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <Tag className="mx-auto mb-3 h-7 w-7 text-slate-400" />
            <h2 className="font-luxury text-xl font-bold text-slate-900">
              New offers are coming soon
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              There are no active promotional codes available right now.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {coupons.map((c) => (
            <div
              key={c.code}
              className="motion-card bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
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
                  <p>• Minimum spend: ${Number(c.minOrderAmount || 0).toFixed(2)}</p>
                  {c.maxDiscountAmount && c.discountType === 'percentage' && (
                    <p>• Maximum savings: ${Number(c.maxDiscountAmount).toFixed(2)}</p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Valid through {new Date(c.endDate).toLocaleDateString()}
                  </p>
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
