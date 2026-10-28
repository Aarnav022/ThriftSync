import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: [true, 'Refund amount in paise is required'],
      min: [0, 'Refund amount cannot be negative'],
    },
    providerRefundId: {
      type: String,
      trim: true,
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Refund reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

refundSchema.index({ order: 1, createdAt: -1 });

export const Refund = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
export default Refund;
