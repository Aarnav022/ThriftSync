import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Maximum quantity per item is 10'],
      default: 1,
    },
    priceSnapshotPaise: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestId: {
      type: String,
      default: null,
      trim: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ guestId: 1 }, { unique: true, sparse: true });

cartSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
export default Cart;
