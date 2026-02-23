"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import OrderModal, { OrderModalItem } from "../components/OrderModal";

type Ctx = {
  openOrder: (item: OrderModalItem) => void;
  closeOrder: () => void;
};

const OrderContext = createContext<Ctx | null>(null);

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used inside OrderProvider");
  return ctx;
}

export default function OrderProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<OrderModalItem | null>(null);

  const value = useMemo<Ctx>(
    () => ({
      openOrder: (it) => {
        setItem(it);
        setIsOpen(true);
      },
      closeOrder: () => {
        setIsOpen(false);
        setItem(null);
      },
    }),
    []
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
      <OrderModal isOpen={isOpen} item={item} onClose={value.closeOrder} />
    </OrderContext.Provider>
  );
}