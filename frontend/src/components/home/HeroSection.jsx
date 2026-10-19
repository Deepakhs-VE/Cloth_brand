import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const fallbackHero = {
  badge: 'SPRING / SUMMER COUTURE EDIT',
  title: 'Modern Tailoring & Pure Natural Fibres',
  subtitle:
    'Hand-finished silhouettes, noble materials, and considered details designed for timeless elegance.',
  ctaLink: '/products',
  secondaryCtaText: 'View Atelier Privileges',
  secondaryCtaLink: '/offers',
  imageUrl: '/image-placeholder.svg',
};

export const HeroSection = () => {
  const { settings } = useSettings();
  const hero = settings?.hero || fallbackHero;
  const brandName = settings?.brandName || 'AURA Atelier';

  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-[#f7f3ec] text-slate-950">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-white/80 blur-3xl" />

      <div className="relative mx-auto grid min-h-[540px] max-w-[1500px] items-stretch lg:grid-cols-[0.96fr_1.04fr]">
        <div className="relative z-10 flex items-center px-5 py-12 sm:px-10 lg:px-14 lg:py-12 xl:px-20">
          <div className="max-w-2xl">
            {hero.badge && (
              <div className="hero-reveal mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white/75 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-amber-800 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>{hero.badge}</span>
              </div>
            )}

            <p className="hero-reveal hero-delay-1 mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
              The new expression of modern luxury
            </p>
            <h1 className="hero-reveal hero-delay-2 font-luxury text-4xl font-extrabold leading-[1.06] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem] xl:text-[3.6rem]">
              {hero.title || fallbackHero.title}
            </h1>
            <p className="hero-reveal hero-delay-3 mt-4 max-w-xl text-base leading-7 text-slate-600 lg:text-[1.05rem]">
              {hero.subtitle || fallbackHero.subtitle}
            </p>

            <div className="hero-reveal hero-delay-4 mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={hero.ctaLink || '/products'}
                className="pressable group inline-flex items-center justify-center gap-3 rounded-xl bg-slate-950 px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xl shadow-slate-900/10 hover:bg-amber-700"
              >
                <span>Shop Now</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {hero.secondaryCtaText && (
                <Link
                  to={hero.secondaryCtaLink || '/offers'}
                  className="pressable inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white/65 px-8 py-4 text-xs font-bold uppercase tracking-[0.13em] text-slate-800 hover:border-slate-500 hover:bg-white"
                >
                  {hero.secondaryCtaText}
                </Link>
              )}
            </div>

            <div className="hero-reveal hero-delay-5 mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-300/70 pt-5 text-xs font-semibold text-slate-600">
              {['Authentic materials', 'Express delivery', '10-day returns'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden lg:min-h-full">
          <div className="absolute inset-4 overflow-hidden rounded-[2rem] bg-stone-200 shadow-2xl shadow-slate-900/15 sm:inset-6 lg:bottom-8 lg:left-0 lg:right-8 lg:top-8">
            <img
              src={hero.imageUrl || fallbackHero.imageUrl}
              alt={hero.title || `${brandName} collection`}
              className="hero-image-settle h-full w-full object-cover object-center"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = '/image-placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-white/5" />
            <div className="absolute bottom-5 left-5 rounded-xl border border-white/40 bg-white/85 px-4 py-3 shadow-lg backdrop-blur-md sm:bottom-7 sm:left-7">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-amber-700">{brandName}</p>
              <p className="mt-1 font-luxury text-sm font-bold text-slate-950">Considered. Timeless. Yours.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
