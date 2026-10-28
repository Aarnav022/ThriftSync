import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Reservation quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'COMMITTED', 'RELEASED'],
        message: 'Status must be PENDING, COMMITTED, or RELEASED',
      },
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Reservation expiration date is required'],
      index: true,
    },
    committedAt: {
      type: Date,
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    releaseReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for background worker cleanup of expired pending reservations
reservationSchema.index({ status: 1, expiresAt: 1 });
reservationSchema.index({ order: 1, status: 1 });

reservationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
export default Reservation;
