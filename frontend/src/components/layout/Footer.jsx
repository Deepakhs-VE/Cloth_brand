import React from 'react';
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
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const Footer = () => {
  const { settings } = useSettings();

  const brandName = settings?.brandName || 'AURA';
  const tagline = settings?.tagline || 'Modern tailoring · Natural fibres · Timeless essentials';
  const contactInfo = settings?.contactInfo || {};
  const socialLinks = [
    { label: 'Instagram', href: settings?.socialLinks?.instagram, Icon: Instagram },
    { label: 'Facebook', href: settings?.socialLinks?.facebook, Icon: Facebook },
    { label: 'X / Twitter', href: settings?.socialLinks?.twitter, Icon: Twitter },
    { label: 'LinkedIn', href: settings?.socialLinks?.linkedin, Icon: Linkedin },
    { label: 'YouTube', href: settings?.socialLinks?.youtube, Icon: Youtube },
  ].filter((item) => item.href);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-8 pb-5 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-7 border-b border-slate-900 pb-7 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
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
              {contactInfo.address && <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{contactInfo.address}</span>
              </div>}
              {contactInfo.phone && <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <a href={`tel:${contactInfo.phone}`} className="hover:text-white transition">{contactInfo.phone}</a>
              </div>}
              {contactInfo.email && <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <a href={`mailto:${contactInfo.email}`} className="hover:text-white transition">{contactInfo.email}</a>
              </div>}
              {contactInfo.workingHours && <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{contactInfo.workingHours}</span>
              </div>}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center space-x-2.5 pt-1">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-slate-900 hover:bg-amber-600 hover:text-white flex items-center justify-center transition"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
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
                  Featured Edit
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

        </div>

        {/* Bottom Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-3 sm:space-y-0">
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
