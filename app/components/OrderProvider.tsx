"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { CartItem, CheckoutPayload } from "../menu/cartTypes";
import CartDrawer from "../menu/CartDrawer";
import CheckoutModal from "../menu/CheckoutModal";

type OrderContextValue = {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;

  addToCart: (item: CartItem) => void;
  incQty: (name: string, priceLabel: string) => void;
  decQty: (name: string, priceLabel: string) => void;
  removeItem: (name: string, priceLabel: string) => void;
  clearCart: () => void;

  openCart: () => void;
  closeCart: () => void;

  openCheckout: () => void;
  closeCheckout: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within <OrderProvider />");
  return ctx;
}

function keyOf(name: string, priceLabel: string) {
  return `${name}__${priceLabel}`;
}

export default function OrderProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cartCount = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, it) => s + it.qty * it.priceValue, 0), [cart]);

  function addToCart(item: CartItem) {
    setCart((prev) => {
      const k = keyOf(item.name, item.priceLabel);
      const idx = prev.findIndex((x) => keyOf(x.name, x.priceLabel) === k);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + (item.qty ?? 1) };
        return next;
      }
      return [...prev, { ...item, qty: item.qty ?? 1 }];
    });
    setCartOpen(true);
  }

  function incQty(name: string, priceLabel: string) {
    setCart((prev) =>
      prev.map((it) =>
        it.name === name && it.priceLabel === priceLabel ? { ...it, qty: it.qty + 1 } : it
      )
    );
  }

  function decQty(name: string, priceLabel: string) {
    setCart((prev) =>
      prev
        .map((it) =>
          it.name === name && it.priceLabel === priceLabel ? { ...it, qty: it.qty - 1 } : it
        )
        .filter((it) => it.qty > 0)
    );
  }

  function removeItem(name: string, priceLabel: string) {
    setCart((prev) => prev.filter((it) => !(it.name === name && it.priceLabel === priceLabel)));
  }

  function clearCart() {
    setCart([]);
  }

  function openCart() {
    setCartOpen(true);
    setCheckoutOpen(false);
  }
  function closeCart() {
    setCartOpen(false);
  }

  function openCheckout() {
    if (cart.length === 0) return;
    setCheckoutOpen(true);
    setCartOpen(false);
  }
  function closeCheckout() {
    setCheckoutOpen(false);
  }

  const value: OrderContextValue = {
    cart,
    cartCount,
    cartTotal,
    addToCart,
    incQty,
    decQty,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    openCheckout,
    closeCheckout,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}

      {/* UI overlays */}
      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        onCheckout={openCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={closeCheckout}
        cart={cart}
        cartTotal={cartTotal}
        onSuccess={() => {
          clearCart();
          closeCheckout();
        }}
      />
    </OrderContext.Provider>
  );
}