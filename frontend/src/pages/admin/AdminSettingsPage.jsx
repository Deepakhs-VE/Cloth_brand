import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Globe,
  Sliders,
  Share2,
  FileText,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useSettings } from '../../context/SettingsContext';
import { InternationalPhoneInput, isPhoneValid } from '../../components/common/InternationalPhoneInput';
import { ImageUpload } from '../../components/common/ImageUpload';
import { useApplicationAlert } from '../../context/ApplicationAlertContext';

export const AdminSettingsPage = () => {
  const { showAlert } = useApplicationAlert();
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('brand');

  const [settings, setSettings] = useState({
    brandName: '',
    tagline: '',
    logoUrl: '',
    hero: {
      badge: '',
      title: '',
      subtitle: '',
      ctaText: '',
      ctaLink: '',
      secondaryCtaText: '',
      secondaryCtaLink: '',
      imageUrl: '',
    },
    specialOfferBanner: {
      isEnabled: true,
      badge: '',
      title: '',
      subtitle: '',
      couponCode: '',
      discountText: '',
      buttonText: '',
      buttonLink: '',
    },
    contactInfo: {
      email: '',
      phone: '',
      whatsappNumber: '',
      address: '',
      workingHours: '',
    },
    socialLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      youtube: '',
    },
    announcementBar: {
      isEnabled: true,
      text: '',
      link: '',
    },
    policies: {
      privacyPolicy: '',
      termsAndConditions: '',
      refundPolicy: '',
      shippingPolicy: '',
    },
    aboutUs: {
      imageUrl: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.data.success && res.data.settings) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    if (
      !isPhoneValid(settings.contactInfo?.phone, true) ||
      !isPhoneValid(settings.contactInfo?.whatsappNumber, true)
    ) {
      showAlert('Enter valid support and WhatsApp numbers including their country codes.', {
        type: 'warning',
        title: 'Invalid Phone Number',
      });
      setSaving(false);
      return;
    }

    try {
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        setSuccessMsg('Settings updated successfully!');
        await refreshSettings();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Brand Architecture Settings">
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { key: 'brand', label: 'Brand & Announcement', icon: Globe },
    { key: 'hero', label: 'Hero Showcase', icon: Sliders },
    { key: 'offer', label: 'Promo Banner', icon: Sparkles },
    { key: 'contact', label: 'Contact & WhatsApp', icon: PhoneCall },
    { key: 'social', label: 'Social Networks', icon: Share2 },
    { key: 'policies', label: 'Client Policies', icon: FileText },
  ];

  return (
    <AdminLayout title="Brand Architecture & Global Settings">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Sticky section navigation and save controls */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-h-8 flex items-center">
              {successMsg ? (
                <span className="flex items-center text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg font-bold border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {successMsg}
                </span>
              ) : (
                <p className="text-xs font-semibold text-slate-600">Choose a settings section below</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 sm:px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition flex items-center space-x-2 shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 pt-3 pb-1" role="tablist" aria-label="Settings sections">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Boxes */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
          {/* 1. Brand Tab */}
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <h3 className="font-luxury text-lg font-bold text-slate-900">Brand Identity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.brandName || ''}
                    onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Brand Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline || ''}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ImageUpload
                  label="Brand Logo"
                  value={settings.logoUrl || ''}
                  onChange={(logoUrl) => setSettings({ ...settings, logoUrl })}
                  purpose="branding"
                  aspectClass="aspect-[3/1]"
                />
                <ImageUpload
                  label="About Section Image"
                  value={settings.aboutUs?.imageUrl || ''}
                  onChange={(imageUrl) => setSettings({
                    ...settings,
                    aboutUs: { ...settings.aboutUs, imageUrl },
                  })}
                  purpose="branding"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="annActive"
                    checked={settings.announcementBar?.isEnabled || false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        announcementBar: {
                          ...settings.announcementBar,
                          isEnabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-slate-900"
                  />
                  <label htmlFor="annActive" className="text-xs font-bold text-slate-800">
                    Enable Top Announcement Bar
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Announcement Banner Text
                  </label>
                  <input
                    type="text"
                    value={settings.announcementBar?.text || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        announcementBar: { ...settings.announcementBar, text: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Hero Tab */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <h3 className="font-luxury text-lg font-bold text-slate-900">Hero Section Showcase</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Hero Badge Text
                  </label>
                  <input
                    type="text"
                    value={settings.hero?.badge || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, badge: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Hero Headline Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.hero?.title || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, title: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Hero Subtitle Description
                </label>
                <textarea
                  rows={3}
                  value={settings.hero?.subtitle || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                    Primary CTA Text
                  </label>
                  <input
                    type="text"
                    value={settings.hero?.ctaText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, ctaText: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                    Primary CTA Link
                  </label>
                  <input
                    type="text"
                    value={settings.hero?.ctaLink || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, ctaLink: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                    Secondary CTA Text
                  </label>
                  <input
                    type="text"
                    value={settings.hero?.secondaryCtaText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, secondaryCtaText: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                    Secondary CTA Link
                  </label>
                  <input
                    type="text"
                    value={settings.hero?.secondaryCtaLink || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, secondaryCtaLink: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <ImageUpload
                label="Hero Background Image"
                value={settings.hero?.imageUrl || ''}
                onChange={(imageUrl) => setSettings({
                  ...settings,
                  hero: { ...settings.hero, imageUrl },
                })}
                purpose="branding"
                required
                aspectClass="aspect-[16/7]"
              />
            </div>
          )}

          {/* 3. Offer Banner Tab */}
          {activeTab === 'offer' && (
            <div className="space-y-6">
              <h3 className="font-luxury text-lg font-bold text-slate-900">Promotional Banner</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="offerActive"
                  checked={settings.specialOfferBanner?.isEnabled || false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      specialOfferBanner: {
                        ...settings.specialOfferBanner,
                        isEnabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-slate-900"
                />
                <label htmlFor="offerActive" className="text-xs font-bold text-slate-800">
                  Enable Promotional Banner on Homepage
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Banner Title
                  </label>
                  <input
                    type="text"
                    value={settings.specialOfferBanner?.title || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        specialOfferBanner: {
                          ...settings.specialOfferBanner,
                          title: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Coupon Code to Feature
                  </label>
                  <input
                    type="text"
                    value={settings.specialOfferBanner?.couponCode || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        specialOfferBanner: {
                          ...settings.specialOfferBanner,
                          couponCode: e.target.value.toUpperCase(),
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Contact & WhatsApp Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="font-luxury text-lg font-bold text-slate-900">Concierge & WhatsApp</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Concierge Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactInfo?.email || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contactInfo: { ...settings.contactInfo, email: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Support Phone Number
                  </label>
                  <InternationalPhoneInput
                    required
                    value={settings.contactInfo?.phone || ''}
                    onChange={(phone) =>
                      setSettings({
                        ...settings,
                        contactInfo: { ...settings.contactInfo, phone },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    WhatsApp Number
                  </label>
                  <InternationalPhoneInput
                    required
                    value={settings.contactInfo?.whatsappNumber || ''}
                    onChange={(whatsappNumber) =>
                      setSettings({
                        ...settings,
                        contactInfo: {
                          ...settings.contactInfo,
                          whatsappNumber,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={settings.contactInfo?.workingHours || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contactInfo: {
                          ...settings.contactInfo,
                          workingHours: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Mailing / Atelier Address
                </label>
                <input
                  type="text"
                  value={settings.contactInfo?.address || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, address: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {/* 5. Social Links Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <h3 className="font-luxury text-lg font-bold text-slate-900">Social Media Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['instagram', 'facebook', 'twitter', 'linkedin', 'youtube'].map((platform) => (
                  <div key={platform}>
                    <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                      {platform} URL
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks?.[platform] || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          socialLinks: {
                            ...settings.socialLinks,
                            [platform]: e.target.value,
                          },
                        })
                      }
                      placeholder={`https://${platform}.com/...`}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Policies Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <h3 className="font-luxury text-lg font-bold text-slate-900">Public Policy Documents</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Privacy Policy
                  </label>
                  <textarea
                    rows={4}
                    value={settings.policies?.privacyPolicy || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        policies: {
                          ...settings.policies,
                          privacyPolicy: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={settings.policies?.termsAndConditions || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        policies: {
                          ...settings.policies,
                          termsAndConditions: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    30-Day Refund & Returns Policy
                  </label>
                  <textarea
                    rows={4}
                    value={settings.policies?.refundPolicy || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        policies: {
                          ...settings.policies,
                          refundPolicy: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Shipping & Delivery Policy
                  </label>
                  <textarea
                    rows={4}
                    value={settings.policies?.shippingPolicy || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        policies: {
                          ...settings.policies,
                          shippingPolicy: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </AdminLayout>
  );
};
