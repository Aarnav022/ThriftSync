import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createOrderSchema = z.object({
  listingId: z
    .string({ required_error: 'Listing ID is required' })
    .regex(objectIdRegex, 'Invalid listing ID format'),
  pickupLocation: z
    .string()
    .trim()
    .max(120, 'Pickup location cannot exceed 120 characters')
    .optional()
    .default('Campus Student Center'),
  meetupNotes: z
    .string()
    .trim()
    .max(1000, 'Meetup notes cannot exceed 1000 characters')
    .optional()
    .default(''),
  paymentMethod: z
    .enum(['CAMPUS_HANDOVER', 'OFFLINE_ESCROW', 'STUDENT_PAY'])
    .optional()
    .default('CAMPUS_HANDOVER'),
});

export const confirmOrderSchema = z.object({
  pickupLocation: z
    .string()
    .trim()
    .max(120, 'Pickup location cannot exceed 120 characters')
    .optional(),
  meetupNotes: z
    .string()
    .trim()
    .max(1000, 'Meetup notes cannot exceed 1000 characters')
    .optional()
    .default(''),
});

export const handoverOrderSchema = z.object({
  note: z
    .string()
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const disputeOrderSchema = z.object({
  reason: z
    .string({ required_error: 'Dispute reason is required' })
    .trim()
    .min(10, 'Dispute reason must be at least 10 characters long')
    .max(1000, 'Dispute reason cannot exceed 1000 characters'),
});
