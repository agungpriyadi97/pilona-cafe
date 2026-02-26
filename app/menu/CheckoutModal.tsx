"use client";

import { useMemo, useState } from "react";
import type { CartItem, OrderType } from "./cartTypes";
import { supabase } from "../lib/supabaseClient";

function rupiah(n: number) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return "Rp " + v.toLocaleString("id-ID");
}

function onlyDigits(s: string) {
  return (s || "").replace(/[^\d]/g, "");
}

export default function CheckoutModal({
  open,
  onClose,
  cart,
  cartTotal,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotal: number;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const p = onlyDigits(phone);
    return cart.length > 0 && name.trim().length >= 2 && p.length >= 9 && !loading;
  }, [cart.length, name, phone, loading]);

  if (!open) return null;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);

    try {
      // ✅ WAJIB LOGIN
      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const token = sess.session?.access_token;
      if (!token) {
        alert("Silakan login dulu untuk pesan 🙂");
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        location.href = `/login?next=${next}`;
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: onlyDigits(phone),
          orderType,
          items: cart.map((c) => ({
            name: c.name,
            priceLabel: c.priceLabel ?? null,
            priceValue: Number(c.priceValue ?? 0),
            qty: Number(c.qty ?? 1),
          })),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Gagal kirim pesanan");

      alert("Pesanan terkirim ✅");
      onSuccess();
    } catch (e: any) {
      alert(e?.message ?? "Gagal kirim pesanan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Close backdrop" className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative w-full max-w-lg rounded-3xl border p-6 shadow-xl"
        style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Checkout</div>
            <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              Isi data sekali untuk semua item.
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border px-3 py-2 text-sm font-semibold hover:opacity-90"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            ✕
          </button>
        </div>

        {/* Ringkasan */}
        <div
          className="mt-5 rounded-2xl border p-4"
          style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}
        >
          <div className="text-sm font-semibold">Ringkasan</div>

          <div className="mt-2 space-y-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
            {cart.slice(0, 6).map((c) => (
              <div key={`${c.name}-${c.priceLabel ?? "x"}`} className="flex justify-between gap-3">
                <div className="truncate">
                  {c.qty}x {c.name} ({c.priceLabel ?? "Default"})
                </div>
                <div className="shrink-0">{rupiah(Number(c.qty ?? 1) * Number(c.priceValue ?? 0))}</div>
              </div>
            ))}

            {cart.length > 6 ? (
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                + {cart.length - 6} item lainnya
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex justify-between text-sm">
            <div style={{ color: "rgb(var(--muted))" }}>Total</div>
            <div className="font-semibold">{rupiah(cartTotal)}</div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-5 space-y-4">
          <div>
            <div className="text-sm font-semibold">Nama Lengkap</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama Anda"
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}
            />
          </div>

          <div>
            <div className="text-sm font-semibold">Nomor HP / WhatsApp</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 08123456789"
              inputMode="numeric"
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}
            />
            <div className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
              Minimal 9 digit
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Jenis Pesanan</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType("DINE_IN")}
                className="rounded-2xl border p-4 text-left hover:opacity-90"
                style={{
                  borderColor: "rgb(var(--border))",
                  background: orderType === "DINE_IN" ? "rgb(var(--bg))" : "transparent",
                }}
              >
                <div className="font-semibold">Dine In</div>
                <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Makan di tempat
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrderType("TAKE_AWAY")}
                className="rounded-2xl border p-4 text-left hover:opacity-90"
                style={{
                  borderColor: "rgb(var(--border))",
                  background: orderType === "TAKE_AWAY" ? "rgb(var(--bg))" : "transparent",
                }}
              >
                <div className="font-semibold">Take Away</div>
                <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Bawa pulang
                </div>
              </button>
            </div>
          </div>

          <button
            disabled={!canSubmit}
            onClick={submit}
            className="w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50 hover:opacity-90"
            style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
          >
            {loading ? "Mengirim..." : `Kirim Pesanan • ${rupiah(cartTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}