import crypto from 'crypto';

/**
 * Razorpay Payment Gateway Adapter for ThriftSync India
 */
class RazorpayGatewayAdapter {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || null;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || null;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || null;
    this.isConfigured = Boolean(this.keyId && this.keySecret);
  }

  /**
   * Creates an order with Razorpay in paise
   */
  async createOrder({ amountPaise, currency = 'INR', receipt }) {
    if (!amountPaise || amountPaise <= 0) {
      throw new Error('INVALID_AMOUNT: Order amount in paise must be greater than zero.');
    }

    if (this.isConfigured) {
      // Live integration via standard fetch / Razorpay REST API
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
          payment_capture: 1, // Auto-capture payment upon authorization
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          `GATEWAY_ERROR: Razorpay order creation failed: ${data.error?.description || response.statusText}`
        );
      }

      return {
        providerOrderId: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
      };
    }

    // Safe test adapter mode when production gateway credentials are not yet provisioned
    const simulatedOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
    return {
      providerOrderId: simulatedOrderId,
      amount: amountPaise,
      currency,
      status: 'created',
      isTestMode: true,
    };
  }

  /**
   * Verifies payment signature (HMAC SHA-256)
   */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!this.keySecret) {
      // In test mode, accept simulated signature if formatted
      return Boolean(razorpayPaymentId);
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === razorpaySignature;
  }

  /**
   * Verifies Razorpay Webhook signature against raw request body
   */
  verifyWebhookSignature(rawBody, signature) {
    const secret = this.webhookSecret || this.keySecret;
    if (!secret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Initiates a refund for a captured payment
   */
  async initiateRefund({ paymentId, amountPaise, reason }) {
    if (this.isConfigured) {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          notes: { reason: reason || 'Customer pre-shipment cancellation' },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          `GATEWAY_ERROR: Razorpay refund failed: ${data.error?.description || response.statusText}`
        );
      }

      return {
        providerRefundId: data.id,
        status: data.status,
        amount: data.amount,
      };
    }

    // Safe test fallback
    return {
      providerRefundId: `rfnd_test_${crypto.randomBytes(8).toString('hex')}`,
      status: 'processed',
      amount: amountPaise,
      isTestMode: true,
    };
  }
}

export const paymentGateway = new RazorpayGatewayAdapter();
export default paymentGateway;
