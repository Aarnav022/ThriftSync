import mongoose from 'mongoose';

const counterOfferSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    offeredListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    requestedListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Counter offer message cannot exceed 1000 characters'],
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const timelineEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'PROPOSAL_CREATED',
        'COUNTER_OFFERED',
        'ACCEPTED',
        'REJECTED',
        'WITHDRAWN',
        'CANCELLED',
        'HANDOVER_CONFIRMED',
        'COMPLETED',
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

const swapSchema = new mongoose.Schema(
  {
    proposer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Proposer reference is required'],
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
      index: true,
    },
    offeredListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Offered listing reference is required'],
    },
    requestedListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Requested listing reference is required'],
    },
    initialMessage: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          'PENDING',
          'COUNTERED',
          'ACCEPTED',
          'REJECTED',
          'WITHDRAWN',
          'COMPLETED',
          'CANCELLED',
        ],
        message: 'Invalid swap lifecycle status',
      },
      default: 'PENDING',
      index: true,
    },
    // The participant whose turn it is to respond (initially recipient)
    currentTurn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    counterOffers: {
      type: [counterOfferSchema],
      default: [],
    },
    handoverConfirmations: {
      proposerConfirmed: {
        type: Boolean,
        default: false,
      },
      proposerConfirmedAt: {
        type: Date,
        default: null,
      },
      recipientConfirmed: {
        type: Boolean,
        default: false,
      },
      recipientConfirmedAt: {
        type: Date,
        default: null,
      },
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
      type: [timelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user dashboards and duplicate prevention
swapSchema.index({ proposer: 1, status: 1, createdAt: -1 });
swapSchema.index({ recipient: 1, status: 1, createdAt: -1 });
swapSchema.index({ offeredListing: 1, requestedListing: 1, status: 1 });

swapSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Swap = mongoose.models.Swap || mongoose.model('Swap', swapSchema);
export default Swap;
