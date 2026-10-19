import { SiteSettings } from '../models/SiteSettings.js';
import { Product } from '../models/Product.js';
import { normalizePhoneNumber } from '../utils/phone.js';
import { normalizeEuropeanCountry } from '../utils/countries.js';

const LOCALE_BY_CURRENCY = { EUR: 'en-IE', USD: 'en-US', GBP: 'en-GB', INR: 'en-IN' };

export const getSiteSettings = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

export const updateSiteSettings = async (req, res, next) => {
  try {
    if (req.body.commerce?.currencyCode) {
      const currencyCode = String(req.body.commerce.currencyCode).toUpperCase();
      req.body.commerce.currencyCode = currencyCode;
      req.body.commerce.locale = LOCALE_BY_CURRENCY[currencyCode] || 'en-IE';
    }
    if (req.body.contactInfo?.phone !== undefined) {
      req.body.contactInfo.phone = normalizePhoneNumber(req.body.contactInfo.phone, {
        required: true,
        fieldName: 'Support phone',
      });
    }
    if (req.body.contactInfo?.whatsappNumber !== undefined) {
      req.body.contactInfo.whatsappNumber = normalizePhoneNumber(
        req.body.contactInfo.whatsappNumber,
        { required: true, fieldName: 'WhatsApp number' }
      );
    }

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    // One-time, non-destructive migration: existing catalogue amounts are EUR base prices.
    // Orders are intentionally never touched because they are financial records.
    await Product.updateMany(
      { basePrice: { $exists: false } },
      [{ $set: { basePrice: '$price', baseDiscountPrice: '$discountPrice', baseCurrency: 'EUR' } }]
    );

    await settings.save();
    res.status(200).json({
      success: true,
      message: 'Brand settings updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryQuote = async (req, res, next) => {
  try {
    const country = String(req.body.country || '').trim().toUpperCase();
    const postalCode = String(req.body.postalCode || '').trim().toUpperCase().replace(/\s+/g, ' ');
    const subtotal = Math.max(0, Number(req.body.subtotal) || 0);
    if (!country || !postalCode) {
      return res.status(400).json({ success: false, message: 'Country and postal code are required' });
    }
    normalizeEuropeanCountry(country);

    const settings = await SiteSettings.findOne();
    const commerce = settings?.commerce || {};
    const supported = commerce.supportedCountries || [];
    const blocked = commerce.blockedPostalPrefixes || [];
    const countryAllowed = supported.length === 0 || supported.some((entry) => entry.toUpperCase() === country);
    const postalAllowed = !blocked.some((prefix) => postalCode.startsWith(String(prefix).toUpperCase()));
    if (!countryAllowed || !postalAllowed) {
      return res.status(200).json({ success: true, serviceable: false, message: 'Delivery is not currently available for this location' });
    }

    const freeThreshold = Number(commerce.freeShippingThreshold ?? 150);
    const shippingAmount = subtotal >= freeThreshold ? 0 : Number(commerce.standardShippingAmount ?? 15);
    const minDays = Number(commerce.deliveryMinDays ?? 3);
    const maxDays = Math.max(minDays, Number(commerce.deliveryMaxDays ?? 7));
    const start = new Date();
    start.setDate(start.getDate() + minDays);
    const end = new Date();
    end.setDate(end.getDate() + maxDays);

    res.status(200).json({
      success: true,
      serviceable: true,
      shippingAmount,
      currency: commerce.currencyCode || 'EUR',
      estimatedDelivery: { from: start.toISOString(), to: end.toISOString(), minDays, maxDays },
    });
  } catch (error) {
    next(error);
  }
};
