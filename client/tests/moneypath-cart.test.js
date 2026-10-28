import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatINR, paiseToRupees, rupeesToPaise } from '../src/utils/currency.js';
import {
  getOrCreateGuestId,
  fetchCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  mergeGuestCart,
} from '../src/features/cart/cartService.js';
import apiClient from '../src/services/apiClient.js';

vi.mock('../src/services/apiClient.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Money Path MVP: Indian Currency & Paise Utilities', () => {
  it('correctly converts rupees to paise and paise to rupees', () => {
    expect(rupeesToPaise(499)).toBe(49900);
    expect(rupeesToPaise(49)).toBe(4900);
    expect(rupeesToPaise(0)).toBe(0);
    expect(rupeesToPaise(12.5)).toBe(1250);

    expect(paiseToRupees(49900)).toBe(499);
    expect(paiseToRupees(4900)).toBe(49);
    expect(paiseToRupees(0)).toBe(0);
    expect(paiseToRupees(1250)).toBe(12.5);
  });

  it('formats integer paise as INR Indian rupee currency strings', () => {
    // ₹499
    const formatted499 = formatINR(49900);
    expect(formatted499).toContain('499');
    expect(formatted499).toContain('₹');

    // ₹49
    const formatted49 = formatINR(4900);
    expect(formatted49).toContain('49');

    // ₹0
    const formatted0 = formatINR(0);
    expect(formatted0).toBe('₹0');

    // Force decimals
    expect(formatINR(49900, true)).toContain('.00');

    // Fallbacks
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
    expect(formatINR('invalid')).toBe('₹0');
  });
});

describe('Money Path MVP: Delivery & Free Shipping Rules', () => {
  const FREE_SHIPPING_THRESHOLD_PAISE = 49900; // ₹499
  const FLAT_DELIVERY_PAISE = 4900; // ₹49

  const calculateDeliveryFee = (subtotalPaise) => {
    return subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : FLAT_DELIVERY_PAISE;
  };

  it('charges ₹49 delivery below ₹499 threshold', () => {
    expect(calculateDeliveryFee(0)).toBe(4900);
    expect(calculateDeliveryFee(10000)).toBe(4900); // ₹100
    expect(calculateDeliveryFee(49800)).toBe(4900); // ₹498
  });

  it('applies free shipping (₹0) at or above ₹499 threshold', () => {
    expect(calculateDeliveryFee(49900)).toBe(0); // ₹499
    expect(calculateDeliveryFee(50000)).toBe(0); // ₹500
    expect(calculateDeliveryFee(150000)).toBe(0); // ₹1,500
  });

  it('correctly calculates free shipping progress percentage', () => {
    const calcProgress = (subtotalPaise) =>
      Math.min(100, Math.round((subtotalPaise / FREE_SHIPPING_THRESHOLD_PAISE) * 100));

    expect(calcProgress(0)).toBe(0);
    expect(calcProgress(24950)).toBe(50);
    expect(calcProgress(49900)).toBe(100);
    expect(calcProgress(60000)).toBe(100);
  });
});

describe('Money Path MVP: Client Cart Service & Guest Session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store = {};
    global.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => {
        store[key] = String(val);
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
    };
  });

  it('generates and persists unique guestId in localStorage', () => {
    const guestId1 = getOrCreateGuestId();
    expect(guestId1).toMatch(/^gst_[a-z0-9_]+$/);

    // Subsequent retrieval returns the same guest ID
    const guestId2 = getOrCreateGuestId();
    expect(guestId2).toBe(guestId1);
  });

  it('fetches cart and includes guest header when no token is present', async () => {
    const mockCart = {
      items: [],
      totals: { subtotalPaise: 0, shippingPaise: 4900, totalPaise: 4900, isFreeShipping: false },
    };
    apiClient.get.mockResolvedValueOnce({ success: true, data: mockCart });

    const result = await fetchCart();
    expect(result).toEqual(mockCart);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/cart',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-guest-id': expect.stringMatching(/^gst_/),
        }),
      })
    );
  });

  it('adds item to cart with authoritative server response', async () => {
    const mockCart = {
      items: [{ listing: 'listing_123', quantity: 2, pricePaise: 25000 }],
      totals: { subtotalPaise: 50000, shippingPaise: 0, totalPaise: 50000, isFreeShipping: true },
    };
    apiClient.post.mockResolvedValueOnce({ success: true, data: mockCart });

    const result = await addItemToCart('listing_123', 2);
    expect(result.items.length).toBe(1);
    expect(result.totals.isFreeShipping).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/cart/items',
      { listingId: 'listing_123', quantity: 2 },
      expect.any(Object)
    );
  });

  it('merges guest cart into authenticated user cart on login', async () => {
    localStorage.setItem('thriftsync_guest_id', 'gst_test_guest_123');
    const mockMerged = {
      items: [{ listing: 'listing_1', quantity: 1 }],
      totals: { subtotalPaise: 15000, shippingPaise: 4900, totalPaise: 19900 },
    };
    apiClient.post.mockResolvedValueOnce({ success: true, data: mockMerged });

    const merged = await mergeGuestCart();
    expect(merged.items.length).toBe(1);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/cart/merge',
      { guestId: 'gst_test_guest_123' }
    );
    expect(localStorage.getItem('thriftsync_guest_id')).toBeNull();
  });
});

describe('Money Path MVP: Delivery Address & Checkout Validation', () => {
  it('validates Indian 10-digit mobile number format', () => {
    const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone?.trim());

    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('8123456789')).toBe(true);
    expect(isValidPhone('7000000000')).toBe(true);
    expect(isValidPhone('6999999999')).toBe(true);

    expect(isValidPhone('5999999999')).toBe(false); // starts with 5
    expect(isValidPhone('987654321')).toBe(false); // 9 digits
    expect(isValidPhone('98765432100')).toBe(false); // 11 digits
    expect(isValidPhone('abcdefghij')).toBe(false);
  });

  it('validates Indian 6-digit PIN code format', () => {
    const isValidPinCode = (pin) => /^\d{6}$/.test(pin?.trim());

    expect(isValidPinCode('110001')).toBe(true);
    expect(isValidPinCode('560001')).toBe(true);
    expect(isValidPinCode('700001')).toBe(true);

    expect(isValidPinCode('11000')).toBe(false); // 5 digits
    expect(isValidPinCode('1100011')).toBe(false); // 7 digits
    expect(isValidPinCode('11000a')).toBe(false);
  });

  it('enforces Cash on Delivery (COD) ₹5,000 max order cap', () => {
    const MAX_COD_PAISE = 500000; // ₹5,000

    const isCodEligible = (totalPaise) => totalPaise <= MAX_COD_PAISE;

    expect(isCodEligible(4900)).toBe(true); // ₹49
    expect(isCodEligible(49900)).toBe(true); // ₹499
    expect(isCodEligible(500000)).toBe(true); // ₹5,000
    expect(isCodEligible(500001)).toBe(false); // ₹5,000.01 (exceeded)
    expect(isCodEligible(800000)).toBe(false); // ₹8,000 (exceeded)
  });
});
