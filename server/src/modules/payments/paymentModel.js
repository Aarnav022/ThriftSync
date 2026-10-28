import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['RAZORPAY', 'COD', 'CAMPUS_HANDOVER'],
      default: 'COD',
    },
    providerPaymentId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    providerOrderId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    providerSignature: {
      type: String,
      trim: true,
      default: null,
    },
    amountPaise: {
      type: Number,
      required: [true, 'Amount in paise is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      required: true,
      enum: ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
      index: true,
    },
    rawMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ order: 1, createdAt: -1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
