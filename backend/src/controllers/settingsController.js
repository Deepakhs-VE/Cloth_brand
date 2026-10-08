import { SiteSettings } from '../models/SiteSettings.js';
import { normalizePhoneNumber } from '../utils/phone.js';

export const getSiteSettings = async (req, res, next) => {
  try {
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
