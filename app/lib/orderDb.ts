import { supabase } from "./supabaseClient";

export type OrderType = "DINE_IN" | "TAKE_AWAY";
export type OrderStatus = "MENUNGGU" | "DITERIMA" | "SELESAI";

export async function createOrderDB(input: {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  items: { name: string; priceLabel?: string; priceValue?: number; qty: number }[];
}) {
  const subtotal = input.items.reduce((sum, it) => sum + (it.priceValue ?? 0) * (it.qty ?? 1), 0);
  const tax = 0;
  const total = subtotal + tax;

  const { data: order, error: e1 } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      order_type: input.orderType,
      status: "MENUNGGU",
      subtotal,
      tax,
      total,
    })
    .select("id")
    .single();

  if (e1) throw e1;
  const orderId = order.id as string;

  const { error: e2 } = await supabase.from("order_items").insert(
    input.items.map((it) => ({
      order_id: orderId,
      name: it.name,
      price_label: it.priceLabel ?? null,
      price_value: it.priceValue ?? null,
      qty: it.qty ?? 1,
    }))
  );

  if (e2) throw e2;
  return orderId;
}