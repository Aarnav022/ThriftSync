import mongoose from 'mongoose';

const paymentWebhookSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      default: 'RAZORPAY',
    },
    eventId: {
      type: String,
      required: [true, 'Webhook event ID is required'],
      trim: true,
    },
    eventType: {
      type: String,
      required: [true, 'Webhook event type is required'],
      trim: true,
    },
    signature: {
      type: String,
      default: null,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentWebhookSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export const PaymentWebhookEvent =
  mongoose.models.PaymentWebhookEvent || mongoose.model('PaymentWebhookEvent', paymentWebhookSchema);
export default PaymentWebhookEvent;
