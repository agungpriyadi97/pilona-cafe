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

export async function POST(req: Request) {
  try {
    // ✅ cukup wajib login (customer login Google juga boleh)
    await requireUser(req.headers.get("authorization"));

    const body = (await req.json()) as CreateOrderBody;

    if (!body.customerName?.trim()) throw new Error("Nama wajib diisi");
    if (!body.customerPhone?.trim()) throw new Error("Nomor HP wajib diisi");
    if (!body.items?.length) throw new Error("Keranjang kosong");
    if (body.items.some((x) => !x.name || !x.qty || x.qty < 1)) throw new Error("Item tidak valid");

    const subtotal = body.items.reduce(
      (sum, it) => sum + Number(it.priceValue ?? 0) * Number(it.qty ?? 1),
      0
    );
    const tax = 0;
    const total = subtotal + tax;

    const svc = supabaseService();

    const { data: order, error: e1 } = await svc
      .from("orders")
      .insert({
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        order_type: body.orderType,
        status: "MENUNGGU",
        subtotal,
        tax,
        total,
      })
      .select("id")
      .single();

    if (e1) throw e1;

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

    return NextResponse.json({ ok: true, orderId });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status: code });
  }
}