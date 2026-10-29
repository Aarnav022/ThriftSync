import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDatabaseStatus } from './config/database.js';
import authRoutes from './modules/authentication/authRoutes.js';
import listingRoutes from './modules/listings/listingRoutes.js';
import swapRoutes from './modules/swaps/swapRoutes.js';
import rentalRoutes from './modules/rentals/rentalRoutes.js';
import orderRoutes from './modules/orders/orderRoutes.js';
import reviewRoutes from './modules/reviews/reviewRoutes.js';
import uploadRoutes from './modules/uploads/uploadRoutes.js';
import notificationRoutes from './modules/notifications/notificationRoutes.js';
import userRoutes from './modules/users/userRoutes.js';
import adminRoutes from './modules/administration/adminRoutes.js';
import cartRoutes from './modules/cart/cartRoutes.js';
import addressRoutes from './modules/addresses/addressRoutes.js';
import paymentWebhookRoutes from './modules/payments/paymentWebhookRoutes.js';
import handleErrors from './middleware/handleErrors.js';
import sanitizeInput from './middleware/sanitizeInput.js';
import { apiLimiter, authLimiter, creationLimiter } from './middleware/rateLimiter.js';

const app = express();

// Security Headers via Helmet (CSP, HSTS, X-Frame-Options, X-XSS-Protection)
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors());

// Input parsing with payload size constraints to protect against body flood attacks
// Webhook signature verification requires the pristine raw request buffer before parsing
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization against NoSQL query operator injection and XSS
app.use(sanitizeInput);

// Global API rate limiting for DDoS protection
app.use('/api', apiLimiter);

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'ok',
    service: 'ThriftSync API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus.state,
      ready: dbStatus.isConnected,
    },
  });
});

// Authentication routes (with brute-force protection rate limiting)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

// Users module (User profile & user data isolation)
app.use('/api/users', userRoutes);

// Listing & catalog routes (both /api/listings and /api/products supported)
app.use(['/api/listings', '/api/products'], (req, res, next) => {
  if (req.method === 'POST') return creationLimiter(req, res, next);
  next();
}, listingRoutes);

// Circular student swap routes (with spam creation rate limiter)
app.use('/api/swaps', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') return creationLimiter(req, res, next);
  next();
}, swapRoutes);

// Campus rental lifecycle routes (with spam creation rate limiter)
app.use('/api/rentals', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') return creationLimiter(req, res, next);
  next();
}, rentalRoutes);

// Outright campus purchase & order routes (with spam creation rate limiter)
app.use('/api/orders', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') return creationLimiter(req, res, next);
  next();
}, orderRoutes);

// Shopping cart & guest cart merge module
app.use('/api/cart', cartRoutes);

// Delivery address management module
app.use('/api/addresses', addressRoutes);

// Payment webhooks & reconciliation
app.use('/api/payments', paymentWebhookRoutes);

// Peer reviews & verified campus trust ratings (with spam creation rate limiter)
app.use('/api/reviews', (req, res, next) => {
  if (req.method === 'POST') return creationLimiter(req, res, next);
  next();
}, reviewRoutes);

// Image uploads & Cloudinary storage pipeline (with spam creation rate limiter)
app.use('/api/uploads', (req, res, next) => {
  if (req.method === 'POST') return creationLimiter(req, res, next);
  next();
}, uploadRoutes);

// Campus safety & peer notifications
app.use('/api/notifications', notificationRoutes);

// Administration module (Strict RBAC verification: requireAuthentication + requireAdmin)
app.use('/api/admin', adminRoutes);

// Global centralized error handler (hides stack traces and returns generic errors in production)
app.use(handleErrors);

export default app;
