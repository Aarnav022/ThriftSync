import mongoose from 'mongoose';

const reviewCriteriaSchema = new mongoose.Schema(
  {
    itemConditionAsDescribed: {
      type: Boolean,
      default: true,
    },
    punctualHandover: {
      type: Boolean,
      default: true,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review author reference is required'],
      index: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target user reference is required'],
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
      index: true,
    },
    transactionType: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['PURCHASE', 'RENTAL', 'SWAP'],
        message: 'Transaction type must be PURCHASE, RENTAL, or SWAP',
      },
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Transaction document reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    reviewText: {
      type: String,
      required: [true, 'Review feedback is required'],
      trim: true,
      minlength: [5, 'Review feedback must be at least 5 characters long'],
      maxlength: [1000, 'Review feedback cannot exceed 1000 characters'],
    },
    criteria: {
      type: reviewCriteriaSchema,
      default: () => ({}),
    },
    isVerifiedTransaction: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Strict unique index: prevents duplicate reviews on the same completed transaction
reviewSchema.index({ author: 1, transactionId: 1 }, { unique: true });
reviewSchema.index({ targetUser: 1, createdAt: -1 });
reviewSchema.index({ listing: 1, createdAt: -1 });

reviewSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
