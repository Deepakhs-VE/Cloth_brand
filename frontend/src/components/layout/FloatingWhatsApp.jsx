import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const FloatingWhatsApp = () => {
  const { settings } = useSettings();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const rawNumber = settings?.contactInfo?.whatsappNumber || '18008922872';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
  const greeting = encodeURIComponent(
    `Hello ${settings?.brandName || 'AURA'} Concierge, I would like to inquire about your collection.`
  );
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${greeting}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Tooltip speech bubble */}
      {tooltipOpen && (
        <div className="mb-3 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 max-w-xs text-xs animate-fade-in relative">
          <button
            onClick={() => setTooltipOpen(false)}
            className="absolute top-1 right-1 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="font-semibold text-slate-900 mb-0.5">Need immediate assistance?</p>
          <p className="text-slate-600">
            Chat directly with our luxury concierge on WhatsApp.
          </p>
        </div>
      )}

      {/* Floating button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setTooltipOpen(true)}
        className="relative group w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300"
        aria-label="Chat on WhatsApp"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full" />
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
};
