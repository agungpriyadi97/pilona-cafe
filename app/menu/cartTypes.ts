export type OrderType = "DINE_IN" | "TAKE_AWAY";

export type CartItem = {
  name: string;
  desc?: string;
  qty: number;
  priceValue: number;  // rupiah
  priceLabel: string;  // "R" | "L" | "XL" | "1L" | "Single"
};

export type CheckoutPayload = {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
};