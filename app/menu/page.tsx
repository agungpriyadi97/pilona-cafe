"use client";

import Navbar from "../components/Navbar";
import { useOrder } from "../components/OrderProvider";
import { MENU, MenuItem } from "../data/menu";

const categories = ["Kopi Untukmu","Coffee","Non-Coffee","Oreo Regal Series","Paket","Add-On"] as const;

function priceLabel(item: any) {
  if (typeof item.singlePrice === "number") return `Rp ${item.singlePrice}K`;
  const p = item.price || {};
  const parts = [p.r ? `R ${p.r}` : null, p.l ? `L ${p.l}` : null, p.xl ? `XL ${p.xl}` : null, p.oneL ? `1L ${p.oneL}` : null].filter(Boolean);
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
  const { openOrder } = useOrder();

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-3xl font-semibold">Menu</h1>
        <p className="mt-2" style={{ color: "rgb(var(--muted))" }}>
          Klik “Pesan” untuk isi nama & nomor HP. Default popup = harga size R / singlePrice.
        </p>

        <div className="mt-10 space-y-10">
          {categories.map((cat) => {
            const items = MENU.filter((m) => m.category === cat);
            if (!items.length) return null;

            return (
              <section key={cat} className="rounded-3xl border p-6" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}>
                <h2 className="text-xl font-semibold">{cat}</h2>

                <div className="mt-5 divide-y" style={{ borderColor: "rgb(var(--border))" }}>
                  {items.map((it: MenuItem) => {
                    const defaultPrice = getDefaultPriceRupiah(it);
                    return (
                      <div key={it.name} className="py-4 flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{it.name}</div>
                            {it.badge && (
                              <span className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}>
                                {it.badge}
                              </span>
                            )}
                          </div>
                          {it.desc && <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>{it.desc}</div>}
                          <div className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>{priceLabel(it)}</div>
                        </div>

                        <button
                          onClick={() => openOrder({ name: it.name, desc: it.desc, price: defaultPrice, qty: 1 })}
                          className="shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold hover:opacity-90"
                          style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
                        >
                          Pesan
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 text-sm" style={{ color: "rgb(var(--muted))" }}>
          *Harga bisa mengikuti update outlet/GoFood.
        </div>
      </div>
      <div className="h-24" />
    </main>
  );
}