"use client";

import { CartItem, rupiah } from "./cartTypes";

export default function CartDrawer({
  open,
  onClose,
  items,
  onInc,
  onDec,
  onRemove,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onInc: (key: string) => void;
  onDec: (key: string) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
}) {
  if (!open) return null;

  const total = items.reduce((s, it) => s + it.priceValue * it.qty, 0);
  const count = items.reduce((s, it) => s + it.qty, 0);

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close cart" />

      <div
        className="absolute right-0 top-0 h-full w-full max-w-md border-l p-5 shadow-xl"
        style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))", color: "rgb(var(--text))" }}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Keranjang ({count})</div>
          <button
            className="rounded-xl border px-3 py-2 text-sm font-semibold hover:opacity-90"
            style={{ borderColor: "rgb(var(--border))" }}
            onClick={onClose}
          >
            Tutup
          </button>
        </div>

        <div className="mt-4 space-y-3 overflow-auto pr-1" style={{ maxHeight: "72vh" }}>
          {items.length === 0 ? (
            <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}>
              Keranjang masih kosong.
            </div>
          ) : (
            items.map((it) => (
              <div key={it.key} className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{it.name}</div>
                    {it.desc ? (
                      <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
                        {it.desc}
                      </div>
                    ) : null}
                    <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
                      {rupiah(it.priceValue)}
                    </div>
                  </div>

                  <button
                    className="rounded-xl border px-3 py-2 text-sm font-semibold hover:opacity-90"
                    style={{ borderColor: "rgb(var(--border))" }}
                    onClick={() => onRemove(it.key)}
                  >
                    Hapus
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                    Subtotal:{" "}
                    <span className="font-semibold" style={{ color: "rgb(var(--text))" }}>
                      {rupiah(it.priceValue * it.qty)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="h-9 w-9 rounded-xl border text-lg font-semibold hover:opacity-90"
                      style={{ borderColor: "rgb(var(--border))" }}
                      onClick={() => onDec(it.key)}
                    >
                      -
                    </button>
                    <div className="w-8 text-center font-semibold">{it.qty}</div>
                    <button
                      className="h-9 w-9 rounded-xl border text-lg font-semibold hover:opacity-90"
                      style={{ borderColor: "rgb(var(--border))" }}
                      onClick={() => onInc(it.key)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t p-5" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}>
          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
              Total
            </div>
            <div className="text-lg font-bold">{rupiah(total)}</div>
          </div>

          <button
            disabled={items.length === 0}
            onClick={onCheckout}
            className="mt-4 w-full rounded-2xl px-5 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}