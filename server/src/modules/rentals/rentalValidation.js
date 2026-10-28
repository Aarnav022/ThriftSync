import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createRentalRequestSchema = z
  .object({
    listingId: z
      .string({ required_error: 'Listing ID is required' })
      .regex(objectIdRegex, 'Invalid listing ID format'),
    startDate: z
      .string({ required_error: 'Start date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Start date must be a valid ISO date',
      }),
    endDate: z
      .string({ required_error: 'End date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'End date must be a valid ISO date',
      }),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
      .default(''),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be strictly after start date',
      path: ['endDate'],
    }
  );

export const rentalDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT'], {
    required_error: 'Decision must be either APPROVE or REJECT',
  }),
  reason: z
    .string()
    .trim()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const handoverPickupSchema = z.object({
  condition: z
    .string()
    .trim()
    .max(100, 'Condition cannot exceed 100 characters')
    .optional()
    .default('Good'),
  note: z
    .string()
    .trim()
    .max(500, 'Handover note cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const returnSettlementSchema = z
  .object({
    action: z.enum(['INITIATE_RETURN', 'CONFIRM_RETURN'], {
      required_error: 'Action must be INITIATE_RETURN or CONFIRM_RETURN',
    }),
    conditionAtReturn: z
      .string()
      .trim()
      .max(100, 'Return condition cannot exceed 100 characters')
      .optional()
      .default('Good'),
    depositAction: z
      .enum(['FULL_REFUND', 'PARTIAL_REFUND', 'NO_REFUND'])
      .optional()
      .default('FULL_REFUND'),
    damageDescription: z
      .string()
      .trim()
      .max(1000, 'Damage description cannot exceed 1000 characters')
      .optional()
      .default(''),
    deductionAmount: z
      .number({ invalid_type_error: 'Deduction amount must be a number' })
      .min(0, 'Deduction amount cannot be negative')
      .optional()
      .default(0),
  })
  .refine(
    (data) => {
      if (
        data.action === 'CONFIRM_RETURN' &&
        (data.depositAction === 'PARTIAL_REFUND' || data.depositAction === 'NO_REFUND')
      ) {
        return (
          data.damageDescription && data.damageDescription.trim().length >= 5
        );
      }
      return true;
    },
    {
      message: 'Damage description of at least 5 characters is required when withholding deposit',
      path: ['damageDescription'],
    }
  );

export const rentalCancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, 'Cancellation reason cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const rentalDisputeSchema = z.object({
  reason: z
    .string({ required_error: 'Dispute reason is required' })
    .trim()
    .min(10, 'Dispute reason must be at least 10 characters long')
    .max(1000, 'Dispute reason cannot exceed 1000 characters'),
});
