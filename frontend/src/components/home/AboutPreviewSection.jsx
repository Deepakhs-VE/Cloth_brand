import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const AboutPreviewSection = () => {
  const { settings } = useSettings();

  const about = settings?.aboutUs || {
    title: 'The Architecture of Elegance, The Purity of Natural Fibres',
    subtitle: 'Atelier Philosophy',
    content: 'Founded on the principle that luxury apparel should be deliberate, effortless, and generational. AURA ATELIER partners directly with master heritage mills in Biella, Naples, and Lyon to craft virgin cashmere, Italian Fresco wool, and fluid Mulberry silk silhouettes designed to endure across decades.',
    stats: [
      { label: 'Active Patrons', value: '45K+' },
      { label: 'Natural Fibre Purity', value: '100%' },
      { label: 'Client Satisfaction', value: '99.5%' },
      { label: 'Countries Shipped', value: '68' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
  };

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image side */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-slate-100">
              <img
                src={about.imageUrl}
                alt="Brand Philosophy"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Small accent floating box */}
            <div className="absolute -bottom-6 -right-6 bg-slate-900 text-white p-6 rounded-2xl shadow-xl hidden sm:block max-w-xs border border-slate-800">
              <p className="font-luxury text-2xl font-bold text-amber-400 mb-1">Sustainable</p>
              <p className="text-xs text-slate-300">
                Responsibly sourced noble materials built to outlast trends and transient seasons.
              </p>
            </div>
          </div>

          {/* Content side */}
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-amber-600 mb-2">
                {about.subtitle || 'Our Heritage'}
              </p>
              <h2 className="font-luxury text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {about.title}
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {about.content}
            </p>

            {/* Statistics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
              {about.stats?.map((stat, idx) => (
                <div key={idx}>
                  <p className="font-luxury text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                to="/about"
                className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-bold text-slate-900 hover:text-amber-700 transition group"
              >
                <span>Read Our Full Story</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
