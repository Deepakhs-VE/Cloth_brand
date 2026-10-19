import React, { useState } from 'react';

const CONSENT_KEY = 'aura_cookie_consent_v1';

export const CookieConsent = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem(CONSENT_KEY));
  const save = (analytics) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ necessary: true, analytics, recordedAt: new Date().toISOString() }));
    window.dispatchEvent(new CustomEvent('aura:cookie-consent', { detail: { analytics } }));
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <section role="dialog" aria-label="Cookie preferences" className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
      <p className="font-semibold text-slate-900">Your privacy choices</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">We use essential cookies to keep the store secure. Optional analytics cookies help us improve the experience. You can continue with essential cookies only.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => save(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Essential only</button>
        <button type="button" onClick={() => save(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Accept analytics</button>
      </div>
    </section>
  );
};
