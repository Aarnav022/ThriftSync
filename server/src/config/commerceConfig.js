/**
 * Authoritative Commerce & Financial Configuration for ThriftSync
 * All monetary amounts are defined in integer minor units (paise for INR).
 */

export const COMMERCE_CONFIG = {
  // Product currency
  CURRENCY: 'INR',

  // Delivery / Shipping thresholds in paise (1 INR = 100 paise)
  SHIPPING_FEE_PAISE: parseInt(process.env.SHIPPING_FEE_PAISE, 10) || 4900, // ₹49.00
  FREE_SHIPPING_THRESHOLD_PAISE: parseInt(process.env.FREE_SHIPPING_THRESHOLD_PAISE, 10) || 49900, // ₹499.00

  // Cash on Delivery maximum limit in paise
  COD_MAX_LIMIT_PAISE: parseInt(process.env.COD_MAX_LIMIT_PAISE, 10) || 500000, // ₹5,000.00

  // Inventory reservation duration (15 minutes in milliseconds)
  RESERVATION_EXPIRY_MS: 15 * 60 * 1000,

  // Maximum items allowed per single SKU line in cart
  MAX_QTY_PER_ITEM: 10,

  // Split state machine enumerations
  ORDER_STATUS: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
  },

  PAYMENT_STATUS: {
    UNPAID: 'UNPAID',
    AUTHORIZED: 'AUTHORIZED',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  },

  FULFILLMENT_STATUS: {
    UNFULFILLED: 'UNFULFILLED',
    PACKED: 'PACKED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    RTO: 'RTO',
  },

  PAYMENT_METHODS: {
    COD: 'COD',
    ONLINE_RAZORPAY: 'ONLINE_RAZORPAY',
    CAMPUS_HANDOVER: 'CAMPUS_HANDOVER',
  },

  ACTOR_TYPES: {
    SYSTEM: 'SYSTEM',
    USER: 'USER',
    ADMIN: 'ADMIN',
    WEBHOOK: 'WEBHOOK',
  },
};

export default COMMERCE_CONFIG;
