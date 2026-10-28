import mongoose from 'mongoose';

const idempotencySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Idempotency key is required'],
      trim: true,
    },
    actor: {
      type: String,
      required: [true, 'Actor identifier is required'],
      trim: true,
    },
    operation: {
      type: String,
      required: [true, 'Operation name is required'],
      trim: true,
      default: 'CHECKOUT',
    },
    requestHash: {
      type: String,
      required: [true, 'Request hash is required'],
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '24h' },
    },
  },
  {
    timestamps: true,
  }
);

// Scoped idempotency uniqueness
idempotencySchema.index({ actor: 1, key: 1, operation: 1 }, { unique: true });

export const IdempotencyRecord =
  mongoose.models.IdempotencyRecord || mongoose.model('IdempotencyRecord', idempotencySchema);
export default IdempotencyRecord;
