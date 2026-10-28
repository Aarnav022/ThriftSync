import { z } from 'zod';

export const createListingSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters long')
      .max(120, 'Title cannot exceed 120 characters'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters long')
      .max(2000, 'Description cannot exceed 2000 characters'),
    category: z.enum(['Textbooks', 'Fashion', 'Electronics', 'Dorm & Living', 'Other'], {
      errorMap: () => ({ message: 'Category must be Textbooks, Fashion, Electronics, Dorm & Living, or Other' }),
    }),
    condition: z.enum(['Like New', 'Excellent', 'Good', 'Fair'], {
      errorMap: () => ({ message: 'Condition must be Like New, Excellent, Good, or Fair' }),
    }),
    listingType: z.enum(['buy', 'rent', 'swap', 'buy_and_rent'], {
      errorMap: () => ({ message: 'Listing type must be buy, rent, swap, or buy_and_rent' }),
    }),
    price: z
      .number({ invalid_type_error: 'Price must be a valid number' })
      .nonnegative('Price cannot be negative')
      .optional()
      .nullable(),
    rentalRate: z
      .number({ invalid_type_error: 'Rental rate must be a valid number' })
      .nonnegative('Rental rate cannot be negative')
      .optional()
      .nullable(),
    rentalPeriod: z
      .enum(['per day', 'per week', 'per month', 'per semester'])
      .optional()
      .default('per semester'),
    deposit: z
      .number({ invalid_type_error: 'Deposit must be a valid number' })
      .nonnegative('Deposit cannot be negative')
      .optional()
      .default(0),
    swapFor: z
      .string()
      .trim()
      .max(200, 'Swap preferences cannot exceed 200 characters')
      .optional()
      .nullable(),
    campus: z
      .string()
      .trim()
      .max(100, 'Campus name cannot exceed 100 characters')
      .optional(),
    pickupLocation: z
      .string()
      .trim()
      .max(200, 'Pickup location cannot exceed 200 characters')
      .optional(),
    images: z
      .array(
        z.string().refine(
          (val) => /^https?:\/\//i.test(val) || /^data:image\//i.test(val),
          { message: 'Image must be a valid HTTP(S) URL or data URI' }
        )
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    // If available for purchase, price is required
    if (
      (data.listingType === 'buy' || data.listingType === 'buy_and_rent') &&
      (data.price === undefined || data.price === null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Price is required when listing is available for purchase',
      });
    }

    // If available for rent, rentalRate is required
    if (
      (data.listingType === 'rent' || data.listingType === 'buy_and_rent') &&
      (data.rentalRate === undefined || data.rentalRate === null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rentalRate'],
        message: 'Rental rate is required when listing is available for rent',
      });
    }

    // If listing is a swap, swapFor is required
    if (
      data.listingType === 'swap' &&
      (!data.swapFor || data.swapFor.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['swapFor'],
        message: 'Please specify the item you are seeking in exchange',
      });
    }
  });

export const updateListingSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    category: z.enum(['Textbooks', 'Fashion', 'Electronics', 'Dorm & Living', 'Other']).optional(),
    condition: z.enum(['Like New', 'Excellent', 'Good', 'Fair']).optional(),
    listingType: z.enum(['buy', 'rent', 'swap', 'buy_and_rent']).optional(),
    price: z.number().nonnegative().optional().nullable(),
    rentalRate: z.number().nonnegative().optional().nullable(),
    rentalPeriod: z.enum(['per day', 'per week', 'per month', 'per semester']).optional(),
    deposit: z.number().nonnegative().optional(),
    swapFor: z.string().trim().max(200).optional().nullable(),
    campus: z.string().trim().max(100).optional(),
    pickupLocation: z.string().trim().max(200).optional(),
    images: z
      .array(
        z.string().refine(
          (val) => /^https?:\/\//i.test(val) || /^data:image\//i.test(val),
          { message: 'Image must be a valid HTTP(S) URL or data URI' }
        )
      )
      .optional(),
    status: z.enum(['active', 'reserved', 'rented', 'sold', 'archived']).optional(),
  });
