import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    street: {
      type: String,
      required: [true, 'Street address / hostel details are required'],
      trim: true,
      minlength: [5, 'Street address must be at least 5 characters long'],
      maxlength: [250, 'Street address cannot exceed 250 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    postalCode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit Indian PIN code'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for listing user addresses fast
addressSchema.index({ user: 1, isDefault: -1, createdAt: -1 });

addressSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);
export default Address;
