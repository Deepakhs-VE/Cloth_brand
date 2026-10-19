import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'EUR',
      uppercase: true,
    },
    provider: {
      type: String,
      enum: ['stripe'],
      default: 'stripe',
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'],
      default: 'PENDING',
    },
    stripeSessionId: {
      type: String,
      default: '',
    },
    stripePaymentIntentId: {
      type: String,
      default: '',
    },
    gatewayResponse: {
      type: Object,
      default: {},
    },
    refundInfo: {
      refundId: String,
      amount: Number,
      reason: String,
      status: String,
      refundedAt: Date,
    },
    refunds: {
      type: [
        {
          refundId: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
          reason: { type: String, default: '' },
          status: { type: String, default: '' },
          itemReturnRequestId: { type: mongoose.Schema.Types.ObjectId, default: null },
          refundedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ transactionId: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
