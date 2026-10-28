import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: [
          'ORDER_PLACED',
          'ORDER_CONFIRMED',
          'HANDOVER_SCHEDULED',
          'HANDOVER_COMPLETED',
          'RENTAL_REQUESTED',
          'RENTAL_APPROVED',
          'RENTAL_ACTIVE',
          'RENTAL_RETURNED',
          'SWAP_PROPOSED',
          'SWAP_ACCEPTED',
          'SWAP_REJECTED',
          'REVIEW_RECEIVED',
          'SAFETY_ALERT',
          'SYSTEM_NOTICE',
        ],
        message: 'Invalid notification type',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries: user's unread notifications newest first
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
