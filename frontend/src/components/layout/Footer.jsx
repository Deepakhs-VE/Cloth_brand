import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Send,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const Footer = () => {
  const { settings } = useSettings();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const brandName = settings?.brandName || 'AURA';
  const tagline = settings?.tagline || 'Modern Living • Elevated Craftsmanship • Timeless Essentials';
  const contactInfo = settings?.contactInfo || {
    email: 'concierge@aurastore.com',
    phone: '+91 6363592991',
    address: '450 Lexington Avenue, New York, NY 10017',
    workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM EST',
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-10 pb-6 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-7 lg:gap-8 pb-8 border-b border-slate-900">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="inline-block">
              {settings?.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt={`${brandName} logo`}
                  className="h-10 w-auto max-w-[150px] object-contain mb-2 brightness-0 invert"
                />
              )}
              <span className="font-luxury text-2xl font-extrabold tracking-widest text-white uppercase">
                {brandName}
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">{tagline}</p>

            <div className="pt-1 space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{contactInfo.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{contactInfo.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{contactInfo.workingHours}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-2.5 pt-1">
              <a
                href={settings?.socialLinks?.instagram || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-amber-600 hover:text-white flex items-center justify-center transition"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialLinks?.facebook || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-amber-600 hover:text-white flex items-center justify-center transition"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialLinks?.twitter || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-amber-600 hover:text-white flex items-center justify-center transition"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialLinks?.linkedin || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-amber-600 hover:text-white flex items-center justify-center transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialLinks?.youtube || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-amber-600 hover:text-white flex items-center justify-center transition"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Atelier Collections</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products?category=womens-ready-to-wear" className="hover:text-white transition">
                  Women's Ready-to-Wear
                </Link>
              </li>
              <li>
                <Link to="/products?category=mens-tailoring" className="hover:text-white transition">
                  Men's Tailoring
                </Link>
              </li>
              <li>
                <Link to="/products?category=artisan-outerwear" className="hover:text-white transition">
                  Artisan Outerwear
                </Link>
              </li>
              <li>
                <Link to="/products?category=cashmere-knitwear" className="hover:text-white transition">
                  Cashmere & Knitwear
                </Link>
              </li>
              <li>
                <Link to="/products?category=silk-resortwear" className="hover:text-white transition">
                  Silk & Resortwear
                </Link>
              </li>
              <li>
                <Link to="/products?isFeatured=true" className="hover:text-white transition text-amber-400">
                  Runway Edit 2026
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Client Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/account/orders" className="hover:text-white transition">
                  Track Your Shipment
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-white transition">
                  Special Privileges & Codes
                </Link>
              </li>
              <li>
                <Link to="/policies?tab=shipping" className="hover:text-white transition">
                  Shipping & Handling
                </Link>
              </li>
              <li>
                <Link to="/policies?tab=refund" className="hover:text-white transition">
                  30-Day Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/policies?tab=terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/policies?tab=privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">The Concierge Journal</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive private invitations to preview limited edition releases and horological insights.
            </p>

            {subscribed ? (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/50">
                <CheckCircle className="w-4 h-4" />
                <span>Thank you. You are now subscribed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 p-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-md transition"
                    aria-label="Subscribe"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Strict confidentiality guaranteed.</span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-3 sm:space-y-0">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          <div className="flex space-x-6 text-xs">
            <Link to="/policies?tab=privacy" className="hover:text-slate-300 transition">
              Privacy
            </Link>
            <Link to="/policies?tab=terms" className="hover:text-slate-300 transition">
              Terms
            </Link>
            <Link to="/policies?tab=shipping" className="hover:text-slate-300 transition">
              Shipping
            </Link>
            <Link to="/policies?tab=refund" className="hover:text-slate-300 transition">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
