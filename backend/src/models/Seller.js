import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true, maxlength: 120 },
    legalBusinessName: { type: String, required: true, trim: true, maxlength: 160 },
    supportEmail: { type: String, required: true, trim: true, lowercase: true },
    supportPhone: { type: String, required: true, trim: true },
    vatNumber: { type: String, default: '', trim: true, maxlength: 60 },
    businessAddress: {
      streetAddress: { type: String, default: '', trim: true },
      city: { type: String, default: '', trim: true },
      postalCode: { type: String, default: '', trim: true },
      countryCode: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 2 },
    },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'], default: 'PENDING' },
    commissionRate: { type: Number, min: 0, max: 100, default: 15 },
    reviewTokenHash: { type: String, select: false },
    reviewTokenExpires: { type: Date, select: false },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

sellerSchema.index({ status: 1, createdAt: -1 });

export const Seller = mongoose.model('Seller', sellerSchema);
