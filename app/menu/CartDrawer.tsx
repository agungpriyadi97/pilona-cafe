"use client";

import { useMemo } from "react";
import { useOrder } from "../components/OrderProvider";

function rupiah(n: number) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return "Rp " + v.toLocaleString("id-ID");
}

export default function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const { cart, cartCount, cartTotal, incQty, decQty, removeItem } = useOrder();

  const hasItems = cart.length > 0;

  const title = useMemo(() => {
    if (!hasItems) return "Keranjang kosong";
    return `Keranjang (${cartCount})`;
  }, [hasItems, cartCount]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md border-l shadow-xl"
        style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: "rgb(var(--border))" }}
        >
          <div className="text-base font-semibold">{title}</div>

          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:opacity-90"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            Tutup
          </button>
        </div>

        {/* Content (scroll) */}
        <div
          className="overflow-auto px-6 py-6 space-y-4"
          style={{ height: "calc(100vh - 88px - 120px)" }} // header ~88px, footer ~120px
        >
          {!hasItems ? (
            <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
              Tambahkan menu dulu ya 🙂
            </div>
          ) : (
            cart.map((it) => (
              <div
                key={`${it.name}-${it.priceLabel}`}
                className="rounded-3xl border p-5"
                style={{
                  borderColor: "rgb(var(--border))",
                  background: "rgb(var(--bg))",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{it.name}</div>

                    <div className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
                      {it.priceLabel} • {rupiah(it.priceValue)}
                    </div>

                    {it.desc ? (
                      <div className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
                        {it.desc}
                      </div>
                    ) : null}
                  </div>

                  <button
                    onClick={() => removeItem(it.name, it.priceLabel)}
                    className="shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold hover:opacity-90"
                    style={{ borderColor: "rgb(var(--border))" }}
                  >
                    Hapus
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decQty(it.name, it.priceLabel)}
                      className="rounded-xl border px-3 py-2 text-sm font-semibold hover:opacity-90"
                      style={{ borderColor: "rgb(var(--border))" }}
                      aria-label="Kurangi qty"
                    >
                      −
                    </button>

                    <div className="w-10 text-center font-semibold">{it.qty}</div>

                    <button
                      onClick={() => incQty(it.name, it.priceLabel)}
                      className="rounded-xl border px-3 py-2 text-sm font-semibold hover:opacity-90"
                      style={{ borderColor: "rgb(var(--border))" }}
                      aria-label="Tambah qty"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-sm font-semibold whitespace-nowrap">
                    {rupiah(it.qty * it.priceValue)}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* spacer biar nggak mepet */}
          <div className="h-6" />
        </div>

        {/* Sticky Footer */}
        <div
          className="sticky bottom-0 px-6 py-5 border-t"
          style={{
            borderColor: "rgb(var(--border))",
            background: "rgb(var(--surface))",
          }}
        >
          <div className="flex items-center justify-between text-sm">
            <div style={{ color: "rgb(var(--muted))" }}>Total</div>
            <div className="text-base font-semibold">{rupiah(cartTotal)}</div>
          </div>

          <button
            disabled={!hasItems}
            onClick={onCheckout}
            className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50 hover:opacity-90"
            style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}