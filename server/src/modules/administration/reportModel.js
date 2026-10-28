import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: {
        values: ['LISTING', 'USER'],
        message: 'Target type must be LISTING or USER',
      },
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      enum: {
        values: [
          'PROHIBITED_ITEM',
          'INAPPROPRIATE_CONTENT',
          'COUNTERFEIT_OR_SCAM',
          'HARASSMENT_OR_SAFETY',
          'MISREPRESENTATION',
          'OTHER',
        ],
        message: 'Invalid report reason',
      },
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'RESOLVED', 'DISMISSED'],
        message: 'Status must be PENDING, RESOLVED, or DISMISSED',
      },
      default: 'PENDING',
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Resolution notes cannot exceed 500 characters'],
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports on the same target by the same student
reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });

reportSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;
