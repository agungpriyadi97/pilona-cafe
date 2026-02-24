"use client";

import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { MENU, MenuItem } from "../data/menu";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import { CartItem, rupiah } from "./cartTypes";
import { createOrderDB } from "../lib/orderDb"; // <- SESUAIKAN PATH kalau beda

const categories = ["Kopi Untukmu", "Coffee", "Non-Coffee", "Oreo Regal Series", "Paket", "Add-On"] as const;

function priceLabel(item: any) {
  if (typeof item.singlePrice === "number") return `Rp ${item.singlePrice}K`;
  const p = item.price || {};
  const parts = [
    p.r ? `R ${p.r}` : null,
    p.l ? `L ${p.l}` : null,
    p.xl ? `XL ${p.xl}` : null,
    p.oneL ? `1L ${p.oneL}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" • ") : "-";
}

function getDefaultPriceRupiah(item: any): number {
  if (typeof item.singlePrice === "number") return item.singlePrice * 1000;
  const p = item.price || {};
  const k =
    (typeof p.r === "number" ? p.r : undefined) ??
    (typeof p.l === "number" ? p.l : undefined) ??
    (typeof p.xl === "number" ? p.xl : undefined) ??
    (typeof p.oneL === "number" ? p.oneL : undefined);
  return typeof k === "number" ? k * 1000 : 0;
}

export default function MenuPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const cartCount = useMemo(() => cart.reduce((s, it) => s + it.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, it) => s + it.priceValue * it.qty, 0), [cart]);

  function addToCart(it: MenuItem) {
    const priceValue = getDefaultPriceRupiah(it);
    const key = `${it.name}-${priceValue}`; // default item only

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { key, name: it.name, desc: it.desc, priceValue, qty: 1 }];
    });
  }

  function inc(key: string) {
    setCart((prev) => prev.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x)));
  }

  function dec(key: string) {
    setCart((prev) =>
      prev
        .map((x) => (x.key === key ? { ...x, qty: Math.max(1, x.qty - 1) } : x))
        .filter((x) => x.qty > 0)
    );
  }

  function remove(key: string) {
    setCart((prev) => prev.filter((x) => x.key !== key));
  }

  function goCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  async function submitOrder(payload: { customerName: string; customerPhone: string; orderType: "DINE_IN" | "TAKE_AWAY" }) {
    await createOrderDB({
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      orderType: payload.orderType,
      items: cart.map((c) => ({
        name: c.name,
        priceLabel: "Default",
        priceValue: c.priceValue,
        qty: c.qty,
      })),
    });

    setCart([]);
    setCheckoutOpen(false);
    alert("Pesanan terkirim ✅");
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-3xl font-semibold">Menu</h1>
        <p className="mt-2" style={{ color: "rgb(var(--muted))" }}>
          Klik “Tambah” untuk masuk keranjang. Setelah itu buka Keranjang → Lanjutkan → isi nama & nomor HP.
        </p>

        <div className="mt-10 space-y-10">
          {categories.map((cat) => {
            const items = MENU.filter((m) => m.category === cat);
            if (!items.length) return null;

            return (
              <section
                key={cat}
                className="rounded-3xl border p-6"
                style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}
              >
                <h2 className="text-xl font-semibold">{cat}</h2>

                <div className="mt-5 divide-y" style={{ borderColor: "rgb(var(--border))" }}>
                  {items.map((it: MenuItem) => (
                    <div key={it.name} className="py-4 flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium">{it.name}</div>
                          {it.badge && (
                            <span
                              className="rounded-full border px-2 py-0.5 text-xs"
                              style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
                            >
                              {it.badge}
                            </span>
                          )}
                        </div>

                        {it.desc ? (
                          <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
                            {it.desc}
                          </div>
                        ) : null}

                        <div className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
                          {priceLabel(it)}
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(it)}
                        className="shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold hover:opacity-90"
                        style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
                      >
                        Tambah
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 text-sm" style={{ color: "rgb(var(--muted))" }}>
          *Harga bisa mengikuti update outlet/GoFood.
        </div>
      </div>

      {/* Floating cart */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 right-5 z-50 rounded-2xl px-4 py-3 text-sm font-semibold hover:opacity-90"
          style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
        >
          Keranjang • {cartCount} item • {rupiah(cartTotal)}
        </button>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onInc={inc}
        onDec={dec}
        onRemove={remove}
        onCheckout={goCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart}
        onSubmit={submitOrder}
      />

      <div className="h-24" />
    </main>
  );
}