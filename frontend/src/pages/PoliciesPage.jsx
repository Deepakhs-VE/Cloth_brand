import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, FileText, RotateCcw, Truck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const PoliciesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'privacy';
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState(currentTab);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const policies = settings?.policies || {
    privacyPolicy: 'At AURA, we respect your privacy and are committed to protecting your personal data...',
    termsAndConditions: 'These Terms of Service govern your access to and use of the AURA website and services...',
    refundPolicy: 'We offer an unconditional 30-day return policy for unused items in their original packaging...',
    shippingPolicy: 'Orders are processed within 1-2 business days. Express domestic delivery takes 2-4 business days...',
  };

  const tabs = [
    { key: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, content: policies.privacyPolicy },
    { key: 'terms', label: 'Terms & Conditions', icon: FileText, content: policies.termsAndConditions },
    { key: 'refund', label: 'Refund & Returns', icon: RotateCcw, content: policies.refundPolicy },
    { key: 'shipping', label: 'Shipping & Delivery', icon: Truck, content: policies.shippingPolicy },
  ];

  const currentPolicy = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase font-bold tracking-widest text-amber-600">
            Legal & Client Assurance
          </p>
          <h1 className="font-luxury text-3xl sm:text-4xl font-extrabold text-slate-900">
            {currentPolicy.label}
          </h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-2xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Policy Body */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-sm leading-relaxed text-sm text-slate-700 whitespace-pre-line space-y-4">
          <p>{currentPolicy.content}</p>
        </div>
      </div>
    </div>
  );
};
