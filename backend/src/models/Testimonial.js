import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    roleOrCompany: {
      type: String,
      trim: true,
      default: 'Verified Buyer',
    },
    avatar: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: [true, 'Testimonial text is required'],
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

testimonialSchema.index({ isActive: 1, displayOrder: 1 });

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
