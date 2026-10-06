import React from 'react';
import { ShieldCheck, Award, HeartHandshake, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const AboutPage = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'AURA';

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs uppercase font-bold tracking-widest text-amber-600">
            About Our Atelier
          </p>
          <h1 className="font-luxury text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            The Architecture of Elegance, The Purity of Natural Fibres
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {brandName} was founded with a singular conviction: that true luxury in apparel does not shout—it whispers through the weight of pure virgin cashmere, the fluid drape of Mulberry silk, and the silent precision of bespoke Italian tailoring.
          </p>
        </div>

        {/* Narrative & Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-luxury text-2xl sm:text-3xl font-bold text-slate-900">
              Noble Materials, Unhurried Haute Couture
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In an era dominated by synthetic fast fashion and fleeting trend cycles, {brandName} honors the generational heritage of master garment construction. From Grade-A Mongolian cashmere and Vitale Barberis Canonico tropical wool to heavy 22mm silk charmeuse and stone-washed French flax linen, every fibre is chosen for its breathability, natural drape, and lifelong resilience.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              We partner directly with heritage mills and master tailoring houses in Biella, Naples, Lyon, and Okayama—eliminating intermediary markups to deliver runway-caliber craftsmanship at transparent, direct-to-patron pricing.
            </p>
          </div>

          <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-slate-100">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80"
              alt="Atelier Tailoring & Garment Craftsmanship"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Pillars / Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-luxury text-lg font-bold text-slate-900">Pure Fibre Integrity</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Zero polyester fillers, zero synthetic blends. Every garment is crafted exclusively from 100% natural, biodegradable noble yarns.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-luxury text-lg font-bold text-slate-900">Generational Tailoring</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Floating canvas chests, hand-split double-face seams, and hand-pickstitched lapels engineered for effortless silhouette and movement.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-luxury text-lg font-bold text-slate-900">Concierge Sizing & Care</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enjoy private WhatsApp fit consultations, complimentary hem alterations, and lifelong garment rejuvenation guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
