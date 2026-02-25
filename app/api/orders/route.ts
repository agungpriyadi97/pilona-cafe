import { NextResponse } from "next/server";
import { requireUser } from "../../lib/authUser";
import { supabaseService } from "../../lib/supabaseServer";

type OrderType = "DINE_IN" | "TAKE_AWAY";

type CreateOrderBody = {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  items: Array<{
    name: string;
    priceLabel?: string | null;
    priceValue?: number | null;
    qty: number;
  }>;
};

function onlyDigits(s: string) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

function isOrderType(x: any): x is OrderType {
  return x === "DINE_IN" || x === "TAKE_AWAY";
}

export async function POST(req: Request) {
  try {
    // ✅ wajib login
    const { userId } = await requireUser(req.headers.get("authorization"));

    const body = (await req.json()) as CreateOrderBody;

    const customerName = body.customerName?.trim();
    const customerPhone = onlyDigits(body.customerPhone);
    const orderType = body.orderType;

    if (!customerName) throw new Error("Nama wajib diisi");
    if (customerPhone.length < 9) throw new Error("Nomor HP wajib diisi (min 9 digit)");
    if (!isOrderType(orderType)) throw new Error("Order type tidak valid");
    if (!Array.isArray(body.items) || body.items.length === 0) throw new Error("Keranjang kosong");

    // validasi item
    for (const it of body.items) {
      if (!it?.name?.trim()) throw new Error("Item tidak valid");
      const qty = Number(it.qty ?? 0);
      if (!Number.isFinite(qty) || qty < 1) throw new Error("Qty item tidak valid");
    }

    // hitung total
    const subtotal = body.items.reduce((sum, it) => {
      const price = Number(it.priceValue ?? 0);
      const qty = Number(it.qty ?? 1);
      return sum + (Number.isFinite(price) ? price : 0) * (Number.isFinite(qty) ? qty : 1);
    }, 0);

    const tax = 0;
    const total = subtotal + tax;

    const svc = supabaseService();

    // 1) insert order
    const { data: order, error: e1 } = await svc
      .from("orders")
      .insert({
        // opsional: simpan user_id biar trace siapa yang order (kalau kolom ada)
        // user_id: userId,
        customer_name: customerName,
        customer_phone: customerPhone,
        order_type: orderType,
        status: "MENUNGGU",
        subtotal,
        tax,
        total,
      })
      .select("id")
      .single();

    if (e1) throw e1;

    // 2) insert items
    const orderId = order.id as string;

    const { error: e2 } = await svc.from("order_items").insert(
      body.items.map((it) => ({
        order_id: orderId,
        name: it.name,
        price_label: it.priceLabel ?? null,
        price_value: it.priceValue ?? null,
        qty: it.qty ?? 1,
      }))
    );

    if (e2) throw e2;

    // (opsional) audit event kalau mau
    // await svc.from("audit_logs").insert({ user_id: userId, action: "ORDER_CREATE", meta: { orderId } });

    return NextResponse.json({ ok: true, orderId });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";

    const code =
      msg === "UNAUTHORIZED" ? 401 :
      msg === "FORBIDDEN" ? 403 :
      msg === "ERROR" ? 500 :
      400;

    return NextResponse.json({ error: msg }, { status: code });
  }
}