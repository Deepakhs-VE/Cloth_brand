import crypto from 'crypto';
import { Seller } from '../models/Seller.js';
import { User } from '../models/User.js';
import { emailService } from '../utils/emailService.js';
import { normalizePhoneNumber } from '../utils/phone.js';

const reviewTokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

const getAdminEmails = async () => {
  const admins = await User.find({ role: 'admin' }).select('email').lean();
  return admins.map((admin) => admin.email).filter(Boolean);
};

export const applyToSell = async (req, res, next) => {
  try {
    const { storeName, legalBusinessName, supportEmail, supportPhone, vatNumber, businessAddress = {} } = req.body;
    if (!storeName || !legalBusinessName || !supportEmail || !supportPhone || !businessAddress.countryCode) {
      return res.status(400).json({ success: false, message: 'Complete all required seller application fields' });
    }
    if (!/^\S+@\S+\.\S+$/.test(String(supportEmail))) {
      return res.status(400).json({ success: false, message: 'Provide a valid support email address' });
    }
    if (await Seller.exists({ user: req.user._id })) {
      return res.status(409).json({ success: false, message: 'You have already submitted a seller application' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const seller = await Seller.create({
      user: req.user._id,
      storeName,
      legalBusinessName,
      supportEmail,
      supportPhone: normalizePhoneNumber(supportPhone, { required: true, fieldName: 'Support phone' }),
      vatNumber: vatNumber || '',
      businessAddress: {
        streetAddress: businessAddress.streetAddress || '', city: businessAddress.city || '',
        postalCode: businessAddress.postalCode || '', countryCode: String(businessAddress.countryCode).toUpperCase(),
      },
      reviewTokenHash: reviewTokenHash(token),
      reviewTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const adminEmails = await getAdminEmails();
    if (!adminEmails.length) {
      await Seller.findByIdAndDelete(seller._id);
      return res.status(503).json({ success: false, message: 'No administrator account is available to receive this application.' });
    }
    try {
      await emailService.sendSellerApplicationEmail(seller, req.user, adminEmails, token);
    } catch (error) {
      await Seller.findByIdAndDelete(seller._id);
      throw error;
    }
    res.status(201).json({ success: true, message: 'Application submitted. An administrator has been notified by email.', seller });
  } catch (error) { next(error); }
};

export const getMySellerProfile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return res.status(404).json({ success: false, message: 'Seller application not found' });
    res.json({ success: true, seller });
  } catch (error) { next(error); }
};

export const getSellersAdmin = async (req, res, next) => {
  try {
    const sellers = await Seller.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, sellers });
  } catch (error) { next(error); }
};

// Settlements are not created until marketplace orders are implemented. Keep
// this endpoint so the seller administration screen can load applications.
export const getSellerSettlementsAdmin = async (req, res) => {
  res.json({ success: true, settlements: [] });
};

export const updateSellerAdmin = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });
    const { status, commissionRate } = req.body;
    if (status !== undefined) {
      if (!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid seller status' });
      seller.status = status;
      seller.reviewedAt = status === 'PENDING' ? null : new Date();
      if (status === 'APPROVED') await User.findByIdAndUpdate(seller.user, { role: 'seller' });
      if (['REJECTED', 'SUSPENDED'].includes(status)) await User.findByIdAndUpdate(seller.user, { role: 'customer' });
    }
    if (commissionRate !== undefined) seller.commissionRate = Number(commissionRate);
    await seller.save();
    res.json({ success: true, message: 'Seller updated', seller });
  } catch (error) { next(error); }
};

const getTokenSeller = async (token) => Seller.findOne({ reviewTokenHash: reviewTokenHash(token), reviewTokenExpires: { $gt: new Date() } }).select('+reviewTokenHash +reviewTokenExpires');

export const showEmailReview = async (req, res) => {
  const { token, action } = req.query;
  const seller = token && ['approve', 'reject'].includes(action) ? await getTokenSeller(token) : null;
  if (!seller) return res.status(400).send('<h1>Link unavailable</h1><p>This seller review link is invalid, expired, or has already been used.</p>');
  const label = action === 'approve' ? 'Approve' : 'Reject';
  res.type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${label} seller</title></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:48px auto;padding:24px;color:#0f172a"><h1>${label} seller application</h1><p><strong>${escapeHtml(seller.storeName)}</strong><br>${escapeHtml(seller.legalBusinessName)}<br>${escapeHtml(seller.supportEmail)}</p><p>Confirm this action for the seller application.</p><form method="post" action="/api/sellers/review"><input type="hidden" name="token" value="${escapeHtml(token)}"><input type="hidden" name="action" value="${action}"><button style="padding:12px 20px;background:#0f172a;color:#fff;border:0;border-radius:6px;font-weight:bold;cursor:pointer">${label} application</button></form></body></html>`);
};

export const completeEmailReview = async (req, res, next) => {
  try {
    const { token, action } = req.body;
    if (!token || !['approve', 'reject'].includes(action)) return res.status(400).send('<h1>Invalid review request</h1>');
    const seller = await getTokenSeller(token);
    if (!seller || seller.status !== 'PENDING') return res.status(400).send('<h1>Link unavailable</h1><p>This application was already reviewed or the link expired.</p>');
    seller.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    seller.reviewedAt = new Date(); seller.reviewTokenHash = undefined; seller.reviewTokenExpires = undefined;
    await seller.save();
    await User.findByIdAndUpdate(seller.user, { role: action === 'approve' ? 'seller' : 'customer' });
    res.type('html').send(`<h1>Seller ${action === 'approve' ? 'approved' : 'rejected'}</h1><p>${escapeHtml(seller.storeName)} has been ${action === 'approve' ? 'approved and can now sell.' : 'rejected.'}</p>`);
  } catch (error) { next(error); }
};
