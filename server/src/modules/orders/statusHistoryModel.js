import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: ['ORDER', 'PAYMENT', 'FULFILLMENT', 'RESERVATION'],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    field: {
      type: String,
      required: true,
      enum: ['orderStatus', 'paymentStatus', 'fulfillmentStatus', 'reservationStatus'],
    },
    previousState: {
      type: String,
      default: null,
    },
    newState: {
      type: String,
      required: true,
    },
    actorType: {
      type: String,
      required: true,
      enum: ['SYSTEM', 'USER', 'ADMIN', 'WEBHOOK'],
    },
    actorId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

statusHistorySchema.index({ entityId: 1, createdAt: -1 });

export const StatusHistory =
  mongoose.models.StatusHistory || mongoose.model('StatusHistory', statusHistorySchema);
export default StatusHistory;
