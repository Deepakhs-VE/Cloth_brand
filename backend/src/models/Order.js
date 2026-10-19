import mongoose from 'mongoose';
import { isValidInternationalPhone } from '../utils/phone.js';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  slug: { type: String, default: '' },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
  selectedSize: { type: String, default: '' },
  selectedColor: { type: String, default: '' },
  variantSku: { type: String, default: '' },
  returnPolicy: {
    returnable: { type: Boolean, default: true },
    exchangeable: { type: Boolean, default: true },
    returnWindowDays: { type: Number, min: 0, default: 30 },
    exchangeWindowDays: { type: Number, min: 0, default: 30 },
    finalSale: { type: Boolean, default: false },
    exemptionReason: { type: String, default: '' },
  },
  cancelledQuantity: { type: Number, min: 0, default: 0 },
  returnedQuantity: { type: Number, min: 0, default: 0 },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ],
    required: true,
  },
  note: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

const refundRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['CANCELLATION', 'RETURN'],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'APPROVED',
        'REJECTED',
        'RECEIVED',
        'REFUND_PENDING',
        'COMPLETED',
      ],
      default: 'REQUESTED',
    },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    adminNote: { type: String, default: '', trim: true, maxlength: 1000 },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    receivedAt: Date,
    completedAt: Date,
  },
  { _id: true }
);

const exchangeRequestSchema = new mongoose.Schema(
  {
    orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    fromSize: { type: String, default: '' },
    fromColor: { type: String, default: '' },
    fromVariantSku: { type: String, default: '' },
    toSize: { type: String, default: '' },
    toColor: { type: String, default: '' },
    toVariantSku: { type: String, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'SHIPPED', 'COMPLETED'],
      default: 'REQUESTED',
    },
    adminNote: { type: String, default: '', trim: true, maxlength: 1000 },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    receivedAt: Date,
    shippedAt: Date,
    completedAt: Date,
  },
  { _id: true }
);

const itemReturnRequestSchema = new mongoose.Schema(
  {
    orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    variantSku: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['CANCELLATION', 'RETURN'], required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUND_PENDING', 'COMPLETED'],
      default: 'REQUESTED',
    },
    refundAmount: { type: Number, min: 0, required: true },
    stripeRefundId: { type: String, default: '' },
    adminNote: { type: String, default: '', trim: true, maxlength: 1000 },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    receivedAt: Date,
    completedAt: Date,
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: {
        type: String,
        required: true,
        validate: {
          validator: isValidInternationalPhone,
          message: 'Shipping phone must be valid for its country',
        },
      },
      streetAddress: { type: String, required: true },
      apartment: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      countryCode: { type: String, uppercase: true, trim: true, minlength: 2, maxlength: 2, default: '' },
    },
    paymentMethod: {
      type: String,
      enum: ['stripe'],
      required: true,
      default: 'stripe',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED'],
      default: 'PENDING',
    },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String,
      method: String,
      transactionId: String,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundedAmount: { type: Number, min: 0, default: 0 },
    orderStatus: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED',
      ],
      default: 'PENDING',
    },
    statusHistory: [statusHistorySchema],
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    refundRequest: {
      type: refundRequestSchema,
      default: null,
    },
    exchangeRequests: {
      type: [exchangeRequestSchema],
      default: [],
    },
    itemReturnRequests: {
      type: [itemReturnRequestSchema],
      default: [],
    },
    currency: { type: String, default: 'EUR', uppercase: true, trim: true },
    locale: { type: String, default: 'en-IE', trim: true },
    vatRate: { type: Number, min: 0, max: 100, default: 20 },
    pricesIncludeVat: { type: Boolean, default: true },
    carrier: {
      type: String,
      default: '',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
