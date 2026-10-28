import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'thriftsync_cart_v2';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse cart:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [items]);

  /**
   * Add to Cart with support for both BUY and RENT modes
   */
  const addToCart = (product, quantity = 1, options = {}) => {
    const mode = options.mode || 'buy'; // 'buy' | 'rent'
    const rentalDays = options.rentalDays || 7;
    const cartItemId = `${product.id || product._id}_${mode}_${rentalDays}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.cartItemId === cartItemId && !item.savedForLater
      );

      const maxStock = product.stockCount || product.availableStock || 5;

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(maxStock, updated[existingIdx].quantity + quantity);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          selectedColor: options.selectedColor || updated[existingIdx].selectedColor,
          selectedSize: options.selectedSize || updated[existingIdx].selectedSize,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            cartItemId,
            product,
            mode, // 'buy' | 'rent'
            rentalDays, // 3, 5, 7, 14, 30
            rentalRate: product.rentalRate || Math.round((product.price || 500) * 0.1),
            deposit: product.deposit || Math.round((product.price || 500) * 0.35),
            quantity: Math.max(1, Math.min(maxStock, quantity)),
            selectedColor: options.selectedColor || (product.variants?.colors?.[0] ?? null),
            selectedSize: options.selectedSize || (product.variants?.sizes?.[0] ?? null),
            savedForLater: false,
            addedAt: new Date().toISOString(),
          },
        ];
      }
    });
  };

  const removeFromCart = (cartItemId) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId && item.product.id !== cartItemId));
  };

  const updateQuantity = (cartItemId, quantity, maxStock = 10) => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId || item.product.id === cartItemId
          ? { ...item, quantity: Math.min(maxStock, qty) }
          : item
      )
    );
  };

  const saveForLater = (cartItemId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId || item.product.id === cartItemId
          ? { ...item, savedForLater: true }
          : item
      )
    );
  };

  const moveToCart = (cartItemId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId || item.product.id === cartItemId
          ? { ...item, savedForLater: false }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const activeCartItems = useMemo(
    () => items.filter((item) => !item.savedForLater),
    [items]
  );

  const savedForLaterItems = useMemo(
    () => items.filter((item) => item.savedForLater),
    [items]
  );

  const totalItemCount = useMemo(
    () => activeCartItems.reduce((acc, item) => acc + item.quantity, 0),
    [activeCartItems]
  );

  // Breakdown Calculations
  const calculations = useMemo(() => {
    let purchaseTotal = 0;
    let rentalFeeTotal = 0;
    let securityDepositTotal = 0;

    activeCartItems.forEach((item) => {
      const q = item.quantity;
      if (item.mode === 'rent') {
        const rate = item.rentalRate || 100;
        const dep = item.deposit || 300;
        rentalFeeTotal += rate * q;
        securityDepositTotal += dep * q;
      } else {
        purchaseTotal += (item.product.price || 0) * q;
      }
    });

    const subtotal = purchaseTotal + rentalFeeTotal + securityDepositTotal;
    const campusDeliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 35;
    const grandTotal = subtotal + campusDeliveryFee;

    return {
      purchaseTotal,
      rentalFeeTotal,
      securityDepositTotal,
      subtotal,
      campusDeliveryFee,
      grandTotal,
    };
  }, [activeCartItems]);

  const value = {
    items,
    activeCartItems,
    savedForLaterItems,
    totalItemCount,
    subtotal: calculations.subtotal,
    calculations,
    addToCart,
    removeFromCart,
    updateQuantity,
    saveForLater,
    moveToCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
