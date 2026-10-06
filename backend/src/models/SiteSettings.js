import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      default: 'AURA',
      required: true,
    },
    tagline: {
      type: String,
      default: 'Elevate Everyday Living with Timeless Modern Essentials',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    hero: {
      badge: { type: String, default: '✨ Autumn Collection 2026' },
      title: { type: String, default: 'Curated Elegance for the Modern Connoisseur' },
      subtitle: {
        type: String,
        default: 'Discover premium lifestyle, handcrafted decor, and minimalist tech crafted with sustainable excellence.',
      },
      ctaText: { type: String, default: 'Shop New Arrivals' },
      ctaLink: { type: String, default: '/products' },
      secondaryCtaText: { type: String, default: 'Explore Collections' },
      secondaryCtaLink: { type: String, default: '/offers' },
      imageUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
      },
    },
    specialOfferBanner: {
      isEnabled: { type: Boolean, default: true },
      badge: { type: String, default: 'LIMITED TIME PROMOTION' },
      title: { type: String, default: 'Enjoy Up to 35% Off Signature Essentials' },
      subtitle: { type: String, default: 'Use code LUXE2026 at checkout for instant luxury savings.' },
      couponCode: { type: String, default: 'LUXE2026' },
      discountText: { type: String, default: '35% OFF' },
      buttonText: { type: String, default: 'Claim Offer' },
      buttonLink: { type: String, default: '/products' },
      endDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    },
    contactInfo: {
      email: { type: String, default: 'concierge@aurastore.com' },
      phone: { type: String, default: '+1 (800) 892-2872' },
      whatsappNumber: { type: String, default: '+18008922872' },
      address: { type: String, default: '450 Lexington Avenue, Suite 1800, New York, NY 10017' },
      workingHours: { type: String, default: 'Mon - Sat: 9:00 AM - 8:00 PM EST' },
    },
    socialLinks: {
      instagram: { type: String, default: 'https://instagram.com' },
      facebook: { type: String, default: 'https://facebook.com' },
      twitter: { type: String, default: 'https://twitter.com' },
      linkedin: { type: String, default: 'https://linkedin.com' },
      youtube: { type: String, default: 'https://youtube.com' },
    },
    announcementBar: {
      isEnabled: { type: Boolean, default: true },
      text: { type: String, default: 'Complimentary Worldwide Express Shipping on Orders Over $150 • 30-Day Effortless Returns' },
      link: { type: String, default: '/products' },
    },
    policies: {
      privacyPolicy: {
        type: String,
        default: 'At AURA, we respect your privacy and are committed to protecting your personal data...',
      },
      termsAndConditions: {
        type: String,
        default: 'These Terms of Service govern your access to and use of the AURA website and services...',
      },
      refundPolicy: {
        type: String,
        default: 'We offer an unconditional 30-day return policy for unused items in their original packaging...',
      },
      shippingPolicy: {
        type: String,
        default: 'Orders are processed within 1-2 business days. Express domestic delivery takes 2-4 business days...',
      },
    },
    features: {
      type: [
        {
          icon: { type: String, default: 'Truck' },
          title: { type: String, default: '' },
          description: { type: String, default: '' },
        },
      ],
      default: [
        {
          icon: 'Truck',
          title: 'Worldwide Express',
          description: 'Complimentary shipping over $150',
        },
        {
          icon: 'ShieldCheck',
          title: 'Secure Transactions',
          description: 'Bank-grade 256-bit SSL encryption',
        },
        {
          icon: 'RotateCcw',
          title: '30-Day Guarantee',
          description: 'Hassle-free exchanges & returns',
        },
        {
          icon: 'Headphones',
          title: '24/7 Dedicated Care',
          description: 'Always available concierge support',
        },
      ],
    },
    aboutUs: {
      title: { type: String, default: 'Crafted for Distinction, Designed for Life' },
      subtitle: { type: String, default: 'Our Philosophy' },
      content: {
        type: String,
        default: 'Founded on the principle that luxury should be deliberate and sustainable, AURA curates world-class lifestyle products designed to inspire mindfulness and elegance in daily rituals. Every creation undergoes rigorous craftsmanship checks, ensuring enduring aesthetic and functional quality.',
      },
      stats: {
        type: [
          {
            label: { type: String },
            value: { type: String },
          },
        ],
        default: [
          { label: 'Happy Global Clients', value: '50K+' },
          { label: 'Crafted Products', value: '250+' },
          { label: 'Client Satisfaction', value: '99.4%' },
          { label: 'Countries Shipped', value: '45+' },
        ],
      },
      imageUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      },
    },
  },
  {
    timestamps: true,
  }
);

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
