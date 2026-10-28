import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createReviewSchema = z.object({
  targetUserId: z
    .string({ required_error: 'Target user ID is required' })
    .regex(objectIdRegex, 'Invalid target user ID format'),
  listingId: z
    .string({ required_error: 'Listing ID is required' })
    .regex(objectIdRegex, 'Invalid listing ID format'),
  transactionType: z.enum(['PURCHASE', 'RENTAL', 'SWAP'], {
    required_error: 'Transaction type must be PURCHASE, RENTAL, or SWAP',
  }),
  transactionId: z
    .string({ required_error: 'Transaction ID is required' })
    .regex(objectIdRegex, 'Invalid transaction ID format'),
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  reviewText: z
    .string({ required_error: 'Review text is required' })
    .trim()
    .min(5, 'Review feedback must be at least 5 characters long')
    .max(1000, 'Review feedback cannot exceed 1000 characters'),
  itemConditionAsDescribed: z.boolean().optional().default(true),
  punctualHandover: z.boolean().optional().default(true),
  communication: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .default(5),
});
