import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createSwapSchema = z.object({
  offeredListingId: z
    .string({ required_error: 'Offered listing ID is required' })
    .regex(objectIdRegex, 'Invalid offered listing ID format'),
  requestedListingId: z
    .string({ required_error: 'Requested listing ID is required' })
    .regex(objectIdRegex, 'Invalid requested listing ID format'),
  message: z
    .string()
    .trim()
    .max(1000, 'Message cannot exceed 1000 characters')
    .optional()
    .default(''),
});

export const counterOfferSchema = z.object({
  offeredListingId: z
    .string()
    .regex(objectIdRegex, 'Invalid offered listing ID format')
    .optional(),
  requestedListingId: z
    .string()
    .regex(objectIdRegex, 'Invalid requested listing ID format')
    .optional(),
  message: z
    .string()
    .trim()
    .max(1000, 'Counter offer message cannot exceed 1000 characters')
    .optional()
    .default(''),
});

export const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional()
    .default(''),
});
