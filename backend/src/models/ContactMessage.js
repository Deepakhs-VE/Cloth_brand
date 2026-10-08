import mongoose from 'mongoose';
import { isValidInternationalPhone } from '../utils/phone.js';

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: isValidInternationalPhone,
        message: 'Phone number must be a valid international number',
      },
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['NEW', 'READ', 'IN_PROGRESS', 'RESOLVED'],
      default: 'NEW',
    },
    adminReplyNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ createdAt: -1 });

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
