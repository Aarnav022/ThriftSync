import mongoose from 'mongoose';

const rentalTimelineEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'REQUEST_CREATED',
        'APPROVED',
        'REJECTED',
        'PICKUP_CONFIRMED_RENTER',
        'PICKUP_CONFIRMED_OWNER',
        'RENTAL_ACTIVATED',
        'RETURN_INITIATED',
        'RETURN_CONFIRMED_OWNER',
        'DEPOSIT_SETTLED',
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

const rentalSchema = new mongoose.Schema(
  {
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Renter reference is required'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    rentalPeriod: {
      type: String,
      enum: ['per day', 'per week', 'per month', 'per semester'],
      default: 'per semester',
    },
    durationUnits: {
      type: Number,
      required: true,
      min: [1, 'Rental duration must be at least 1 unit'],
      default: 1,
    },
    rentalFee: {
      type: Number,
      required: [true, 'Rental fee is required'],
      min: [0, 'Rental fee cannot be negative'],
    },
    depositAmount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0, 'Deposit amount cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          'REQUESTED',
          'APPROVED',
          'ACTIVE',
          'RETURN_PENDING',
          'COMPLETED',
          'CANCELLED',
          'OVERDUE',
          'DISPUTED',
          'REJECTED',
        ],
        message: 'Invalid rental lifecycle status',
      },
      default: 'REQUESTED',
      index: true,
    },
    depositStatus: {
      type: String,
      required: true,
      enum: {
        values: ['HELD', 'REFUNDED', 'FORFEITED_PARTIAL', 'FORFEITED_FULL'],
        message: 'Invalid deposit accounting status',
      },
      default: 'HELD',
    },
    depositRefundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative'],
      default: null,
    },
    depositDeductionAmount: {
      type: Number,
      min: [0, 'Deduction amount cannot be negative'],
      default: 0,
    },
    handover: {
      pickupConfirmedByRenter: {
        type: Boolean,
        default: false,
      },
      pickupConfirmedByOwner: {
        type: Boolean,
        default: false,
      },
      pickupConfirmedAt: {
        type: Date,
        default: null,
      },
      returnConfirmedByRenter: {
        type: Boolean,
        default: false,
      },
      returnConfirmedByOwner: {
        type: Boolean,
        default: false,
      },
      returnConfirmedAt: {
        type: Date,
        default: null,
      },
    },
    conditionAtPickup: {
      type: String,
      trim: true,
      default: 'Good',
    },
    conditionAtReturn: {
      type: String,
      trim: true,
      default: null,
    },
    damageReport: {
      hasDamage: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
      },
      deductionAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    timeline: {
      type: [rentalTimelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for concurrent overlap lookups and student dashboards
rentalSchema.index({ listing: 1, status: 1, startDate: 1, endDate: 1 });
rentalSchema.index({ renter: 1, status: 1, createdAt: -1 });
rentalSchema.index({ owner: 1, status: 1, createdAt: -1 });

rentalSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Rental = mongoose.models.Rental || mongoose.model('Rental', rentalSchema);
export default Rental;
