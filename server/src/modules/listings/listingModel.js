import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Textbooks', 'Fashion', 'Electronics', 'Dorm & Living', 'Other'],
        message: 'Category must be Textbooks, Fashion, Electronics, Dorm & Living, or Other',
      },
      index: true,
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: ['Like New', 'Excellent', 'Good', 'Fair'],
        message: 'Condition must be Like New, Excellent, Good, or Fair',
      },
    },
    listingType: {
      type: String,
      required: [true, 'Listing type is required'],
      enum: {
        values: ['buy', 'rent', 'swap', 'buy_and_rent'],
        message: 'Listing type must be buy, rent, swap, or buy_and_rent',
      },
      default: 'buy',
      index: true,
    },
    // Outright purchase price (in USD / standard unit)
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: null,
    },
    // Exact integer price in smallest currency unit (paise for INR: ₹1 = 100 paise)
    pricePaise: {
      type: Number,
      min: [0, 'Price in paise cannot be negative'],
      default: null,
    },
    // SKU code for inventory tracking
    sku: {
      type: String,
      trim: true,
    },
    // Stock counters for two-phase reservation: totalStock = availableStock + reservedStock + soldStock
    totalStock: {
      type: Number,
      min: [0, 'Total stock cannot be negative'],
      default: 1,
    },
    availableStock: {
      type: Number,
      min: [0, 'Available stock cannot be negative'],
      default: 1,
    },
    reservedStock: {
      type: Number,
      min: [0, 'Reserved stock cannot be negative'],
      default: 0,
    },
    soldStock: {
      type: Number,
      min: [0, 'Sold stock cannot be negative'],
      default: 0,
    },
    // Rental charges tracked separately from refundable deposit
    rentalRate: {
      type: Number,
      min: [0, 'Rental rate cannot be negative'],
      default: null,
    },
    rentalPeriod: {
      type: String,
      enum: ['per day', 'per week', 'per month', 'per semester'],
      default: 'per semester',
    },
    // Refundable deposit tracked separately
    deposit: {
      type: Number,
      min: [0, 'Deposit cannot be negative'],
      default: 0,
    },
    // Specific item desired if listing is a swap
    swapFor: {
      type: String,
      trim: true,
      maxlength: [200, 'Swap preferences cannot exceed 200 characters'],
      default: null,
    },
    campus: {
      type: String,
      trim: true,
      default: 'Main Campus',
    },
    pickupLocation: {
      type: String,
      trim: true,
      default: 'Campus Student Center',
    },
    images: {
      type: [String],
      default: [],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'reserved', 'rented', 'sold', 'archived'],
        message: 'Status must be active, reserved, rented, sold, or archived',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Synchronize price and pricePaise and ensure consistent stock defaults
listingSchema.pre('save', function (next) {
  // Sync price in Rupees and integer paise
  if (this.price !== null && (this.pricePaise === null || this.pricePaise === undefined)) {
    this.pricePaise = Math.round(this.price * 100);
  } else if (this.pricePaise !== null && (this.price === null || this.price === undefined)) {
    this.price = this.pricePaise / 100;
  }

  // Generate fallback SKU if not supplied
  if (!this.sku) {
    const idSuffix = (this._id || new mongoose.Types.ObjectId()).toString().slice(-6).toUpperCase();
    this.sku = `TS-${idSuffix}`;
  }

  // Stock initialization
  if (this.isNew) {
    if (this.availableStock === undefined || this.availableStock === null) {
      this.availableStock = this.totalStock !== undefined ? this.totalStock : 1;
    }
  }

  next();
});

// Compound indexes for optimal catalog browsing
listingSchema.index({ status: 1, category: 1, createdAt: -1 });
listingSchema.index({ status: 1, listingType: 1, createdAt: -1 });
listingSchema.index({ sku: 1 }, { sparse: true });
// Text index for keyword searches
listingSchema.index({ title: 'text', description: 'text' });

listingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);
export default Listing;
