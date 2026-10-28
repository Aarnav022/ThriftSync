import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  campus: z
    .string()
    .trim()
    .max(100, 'Campus name cannot exceed 100 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone cannot exceed 30 characters')
    .optional()
    .nullable(),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .or(z.literal(''))
    .optional()
    .nullable(),
  savedAddresses: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        line1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        phone: z.string().optional(),
        pickupSpot: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
});
