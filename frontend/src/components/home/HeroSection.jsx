import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const HeroSection = () => {
  const { settings } = useSettings();

  const hero = settings?.hero || {
    badge: '✨ AUTUMN MASTERWORKS 2026',
    title: 'Timeless Luxury for the Discerning Individual',
    subtitle: 'Bespoke timepieces, audiophile acoustics, and artisanal leather goods crafted with uncompromising precision.',
    ctaText: 'Explore Collection',
    ctaLink: '/products',
    secondaryCtaText: 'View Special Offers',
    secondaryCtaLink: '/offers',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
      {/* Background Image with Dark Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={hero.imageUrl}
          alt={hero.title}
          className="w-full h-full object-cover object-center opacity-40 scale-105 transform animate-pulse duration-10000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          {hero.badge && (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{hero.badge}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="font-luxury text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {hero.title}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
            {hero.subtitle}
          </p>

          {/* Call to Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              to={hero.ctaLink || '/products'}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-950 hover:bg-amber-100 text-xs uppercase tracking-widest font-bold rounded-xl transition duration-200 shadow-xl space-x-2 group"
            >
              <span>{hero.ctaText || 'Shop Collection'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {hero.secondaryCtaText && (
              <Link
                to={hero.secondaryCtaLink || '/offers'}
                className="inline-flex items-center justify-center px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 text-xs uppercase tracking-widest font-bold rounded-xl transition backdrop-blur-sm"
              >
                {hero.secondaryCtaText}
              </Link>
            )}
          </div>

          {/* Trust Highlights */}
          <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div>
              <p className="font-bold text-white text-sm">100% Authentic</p>
              <p>Hand-inspected origins</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Express Courier</p>
              <p>Free on orders &gt; $150</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm">30-Day Privilege</p>
              <p>Effortless returns</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
