import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Copy, Check, ArrowRight } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const SpecialOfferBanner = () => {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);

  const offer = settings?.specialOfferBanner || {
    isEnabled: true,
    badge: 'EXCLUSIVE PRIVILEGE',
    title: 'Unlock 20% Off Your Curated Order',
    subtitle: 'Apply code LUXE2026 at checkout. Complimentary global express shipping included.',
    couponCode: 'LUXE2026',
    discountText: '20% OFF',
    buttonText: 'Claim Your Privilege',
    buttonLink: '/products',
  };

  if (!offer.isEnabled) return null;

  const handleCopyCode = () => {
    if (offer.couponCode) {
      navigator.clipboard.writeText(offer.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* Background subtle geometric accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl transition-colors duration-500 hover:border-slate-700">
          {/* Left Text */}
          <div className="space-y-4 max-w-xl text-center lg:text-left">
            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold uppercase tracking-wider">
              {offer.badge || 'Limited Time Offer'}
            </span>
            <h3 className="font-luxury text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {offer.title}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {offer.subtitle}
            </p>
          </div>

          {/* Right Action / Coupon Box */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {offer.couponCode && (
              <div className="flex items-center bg-slate-950/80 border border-amber-500/40 rounded-xl px-4 py-3 space-x-3">
                <Tag className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Coupon Code</p>
                  <p className="text-sm font-mono font-bold text-amber-400 tracking-wider">
                    {offer.couponCode}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                  title="Copy code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}

            <Link
              to={offer.buttonLink || '/products'}
              className="pressable px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs uppercase tracking-widest font-bold rounded-xl transition shadow-lg flex items-center space-x-2"
            >
              <span>{offer.buttonText || 'Shop Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
