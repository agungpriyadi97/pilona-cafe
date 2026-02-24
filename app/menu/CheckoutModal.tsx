"use client";

import { useState } from "react";
import { CartItem, rupiah } from "./cartTypes";

export default function CheckoutModal({
  open,
  onClose,
  items,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onSubmit: (x: { customerName: string; customerPhone: string; orderType: "DINE_IN" | "TAKE_AWAY" }) => Promise<void>;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKE_AWAY">("DINE_IN");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const total = items.reduce((s, it) => s + it.priceValue * it.qty, 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border p-5 shadow-xl" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}>
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Kirim Pesanan</div>
          <button
            className="rounded-xl border px-3 py-2 text-sm font-semibold hover:opacity-90"
            style={{ borderColor: "rgb(var(--border))" }}
            onClick={onClose}
          >
            Tutup
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))" }}>
            <div className="font-semibold">Total</div>
            <div className="mt-1 text-lg font-bold">{rupiah(total)}</div>
            <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              {items.reduce((s, it) => s + it.qty, 0)} item
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Nama Lengkap</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama Anda"
            />
          </div>

          <div>
            <div className="text-sm font-semibold">Nomor HP / WhatsApp</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Contoh: 08123456789"
            />
            <div className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
              *Minimal 9 digit
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Jenis Pesanan</div>
            <div className="mt-2 flex gap-2">
              <button
                className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold hover:opacity-90"
                style={{
                  borderColor: "rgb(var(--border))",
                  background: orderType === "DINE_IN" ? "rgb(var(--brand))" : "transparent",
                  color: orderType === "DINE_IN" ? "rgb(var(--brandText))" : "rgb(var(--text))",
                }}
                onClick={() => setOrderType("DINE_IN")}
              >
                Dine In
              </button>
              <button
                className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold hover:opacity-90"
                style={{
                  borderColor: "rgb(var(--border))",
                  background: orderType === "TAKE_AWAY" ? "rgb(var(--brand))" : "transparent",
                  color: orderType === "TAKE_AWAY" ? "rgb(var(--brandText))" : "rgb(var(--text))",
                }}
                onClick={() => setOrderType("TAKE_AWAY")}
              >
                Take Away
              </button>
            </div>
          </div>

          <button
            disabled={loading || !customerName || customerPhone.length < 9 || items.length === 0}
            onClick={async () => {
              setLoading(true);
              try {
                await onSubmit({ customerName, customerPhone, orderType });
              } finally {
                setLoading(false);
              }
            }}
            className="mt-2 w-full rounded-2xl px-5 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
          >
            {loading ? "Mengirim..." : `Kirim Pesanan • ${rupiah(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}