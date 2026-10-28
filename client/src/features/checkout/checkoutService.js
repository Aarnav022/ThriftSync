import apiClient from '../../services/apiClient.js';

export async function initiateCheckout({ addressId, shippingAddress, paymentMethod }) {
  const idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const response = await apiClient.post(
    '/orders/checkout',
    { addressId, shippingAddress, paymentMethod },
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
  return response.data;
}

export async function confirmOnlinePayment({
  orderId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
}) {
  const response = await apiClient.post('/orders/confirm-payment', {
    orderId,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
  });
  return response.data;
}

export async function cancelPreShipmentOrder(orderId, reason) {
  const response = await apiClient.patch(`/orders/${orderId}/cancel`, { reason });
  return response.data;
}

export default {
  initiateCheckout,
  confirmOnlinePayment,
  cancelPreShipmentOrder,
};
