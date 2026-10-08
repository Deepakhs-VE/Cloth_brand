import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const iconMap = {
  Truck: Truck,
  ShieldCheck: ShieldCheck,
  RotateCcw: RotateCcw,
  Headphones: Headphones,
};

export const FeaturesBar = () => {
  const { settings } = useSettings();

  const features = settings?.features && settings.features.length > 0
    ? settings.features
    : [
        {
          icon: 'Truck',
          title: 'Worldwide Express Delivery',
          description: 'Complimentary shipping on orders over $150',
        },
        {
          icon: 'ShieldCheck',
          title: 'Bank-Grade Security',
          description: 'Protected with 256-bit SSL encryption',
        },
        {
          icon: 'RotateCcw',
          title: '30-Day Return Privilege',
          description: 'Hassle-free complimentary returns & exchanges',
        },
        {
          icon: 'Headphones',
          title: 'Dedicated Concierge',
          description: 'Round-the-clock advisory & client support',
        },
      ];

  return (
    <section className="bg-white border-b border-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => {
            const IconComponent = iconMap[feature.icon] || ShieldCheck;
            return (
              <div key={idx} className="feature-item group flex items-start space-x-4 rounded-2xl p-2">
                <div className="feature-icon p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-100 flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{feature.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
