import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

/**
 * Strict rate limiter for sensitive authentication endpoints (prevent brute-force).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    status: 'fail',
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for resource creation (prevent spam and automated flood attacks).
 */
export const creationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // limit each IP to 60 creation requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    status: 'fail',
    message: 'Creation rate limit exceeded. Please wait before creating more items or proposals.',
  },
});

/**
 * General API rate limiter for DDoS mitigation.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP address. Please try again later.',
  },
});

export default {
  authLimiter,
  creationLimiter,
  apiLimiter,
};
