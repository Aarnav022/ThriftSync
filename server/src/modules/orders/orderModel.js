import mongoose from 'mongoose';

const orderTimelineEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'ORDER_PLACED',
        'SELLER_CONFIRMED',
        'BUYER_HANDOVER_CONFIRMED',
        'SELLER_HANDOVER_CONFIRMED',
        'COMPLETED',
        'CANCELLED',
        'DISPUTED',
      ],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [
        function () {
          return !this.items || this.items.length === 0;
        },
        'Seller reference is required',
      ],
      index: true,
      default: null,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [
        function () {
          return !this.items || this.items.length === 0;
        },
        'Listing reference is required',
      ],
      index: true,
      default: null,
    },
    // Multi-item order support for Money Path MVP
    items: [
      {
        listing: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Listing',
        },
        sku: {
          type: String,
          trim: true,
        },
        title: {
          type: String,
          trim: true,
        },
        unitPricePaise: {
          type: Number,
          default: 0,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        lineTotalPaise: {
          type: Number,
          default: 0,
        },
        image: {
          type: String,
          default: null,
        },
      },
    ],
    // Shipping Address snapshot
    shippingAddress: {
      fullName: { type: String, trim: true, default: null },
      phone: { type: String, trim: true, default: null },
      street: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      state: { type: String, trim: true, default: null },
      postalCode: { type: String, trim: true, default: null },
    },
    // Integer money calculations in paise (1 INR = 100 paise)
    subtotalPaise: {
      type: Number,
      min: [0, 'Subtotal cannot be negative'],
      default: 0,
    },
    shippingPaise: {
      type: Number,
      min: [0, 'Shipping cannot be negative'],
      default: 0,
    },
    taxPaise: {
      type: Number,
      min: [0, 'Tax cannot be negative'],
      default: 0,
    },
    totalPaise: {
      type: Number,
      min: [0, 'Total paise cannot be negative'],
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    itemPrice: {
      type: Number,
      min: [0, 'Item price cannot be negative'],
      default: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: [0, 'Service fee cannot be negative'],
    },
    totalAmount: {
      type: Number,
      min: [0, 'Total amount cannot be negative'],
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['CAMPUS_HANDOVER', 'OFFLINE_ESCROW', 'STUDENT_PAY', 'COD', 'ONLINE_RAZORPAY'],
        message: 'Invalid payment method',
      },
      default: 'COD',
    },
    // Split State Machine 1: orderStatus
    orderStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        message: 'Invalid orderStatus',
      },
      default: 'PENDING',
      index: true,
    },
    // Split State Machine 2: paymentStatus
    paymentStatus: {
      type: String,
      enum: {
        values: [
          'UNPAID',
          'AUTHORIZED',
          'PAID',
          'FAILED',
          'REFUNDED',
          'PENDING',
          'VERIFIED_UPON_HANDOVER',
          'CANCELLED',
        ],
        message: 'Invalid payment status',
      },
      default: 'UNPAID',
      index: true,
    },
    // Split State Machine 3: fulfillmentStatus
    fulfillmentStatus: {
      type: String,
      enum: {
        values: ['UNFULFILLED', 'PACKED', 'SHIPPED', 'DELIVERED', 'RTO'],
        message: 'Invalid fulfillmentStatus',
      },
      default: 'UNFULFILLED',
      index: true,
    },
    // Manual AWB & Tracking for fulfillment
    tracking: {
      awbNumber: {
        type: String,
        trim: true,
        default: null,
      },
      courierName: {
        type: String,
        trim: true,
        default: null,
      },
      shippedAt: {
        type: Date,
        default: null,
      },
      deliveredAt: {
        type: Date,
        default: null,
      },
    },
    // Scoped Idempotency Key
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    pickupLocation: {
      type: String,
      trim: true,
      default: 'Campus Student Center',
    },
    meetupNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Meetup notes cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
        message: 'Invalid order status',
      },
      default: 'PENDING',
      index: true,
    },
    handover: {
      buyerConfirmed: {
        type: Boolean,
        default: false,
      },
      buyerConfirmedAt: {
        type: Date,
        default: null,
      },
      sellerConfirmed: {
        type: Boolean,
        default: false,
      },
      sellerConfirmedAt: {
        type: Date,
        default: null,
      },
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    timeline: {
      type: [orderTimelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Synchronize state machines and monetary fields
orderSchema.pre('save', function (next) {
  // Synchronize status and orderStatus
  if (this.orderStatus && !this.status) {
    this.status = this.orderStatus;
  } else if (this.status && (!this.orderStatus || this.isModified('status'))) {
    if (['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(this.status)) {
      this.orderStatus = this.status;
    }
  }

  // Synchronize totalPaise and totalAmount
  if (this.totalPaise > 0 && (!this.totalAmount || this.isModified('totalPaise'))) {
    this.totalAmount = this.totalPaise / 100;
  } else if (this.totalAmount > 0 && (!this.totalPaise || this.isModified('totalAmount'))) {
    this.totalPaise = Math.round(this.totalAmount * 100);
  }

  // Fallback for single-item vs multi-item
  if (this.items && this.items.length > 0) {
    if (!this.listing && this.items[0].listing) {
      this.listing = this.items[0].listing;
    }
    if (!this.itemPrice && this.items[0].unitPricePaise) {
      this.itemPrice = this.items[0].unitPricePaise / 100;
    }
  }

  next();
});

// Indexes for fast dashboard filtering
orderSchema.index({ buyer: 1, status: 1, createdAt: -1 });
orderSchema.index({ seller: 1, status: 1, createdAt: -1 });
orderSchema.index({ listing: 1, status: 1 });
orderSchema.index({ buyer: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1, fulfillmentStatus: 1, createdAt: -1 });

orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
