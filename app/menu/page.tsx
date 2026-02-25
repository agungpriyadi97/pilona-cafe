"use client";

import Navbar from "../components/Navbar";
import { useOrder } from "../components/OrderProvider";
import { MENU, MenuItem } from "../data/menu";

const categories = ["Kopi Untukmu", "Coffee", "Non-Coffee", "Oreo Regal Series", "Paket", "Add-On"] as const;

function priceLabel(item: MenuItem) {
  if (typeof item.singlePrice === "number") return `Rp ${item.singlePrice}K`;
  const p = item.price || {};
  const parts = [p.r ? `R ${p.r}` : null, p.l ? `L ${p.l}` : null, p.xl ? `XL ${p.xl}` : null, p.oneL ? `1L ${p.oneL}` : null].filter(
    Boolean
  );
  return parts.length ? parts.join(" • ") : "-";
}

function getDefaultPrice(item: MenuItem): { priceValue: number; priceLabel: string } {
  if (typeof item.singlePrice === "number") return { priceValue: item.singlePrice * 1000, priceLabel: "Single" };
  const p = item.price ?? {};
  if (typeof p.r === "number") return { priceValue: p.r * 1000, priceLabel: "R" };
  if (typeof p.l === "number") return { priceValue: p.l * 1000, priceLabel: "L" };
  if (typeof p.xl === "number") return { priceValue: p.xl * 1000, priceLabel: "XL" };
  if (typeof p.oneL === "number") return { priceValue: p.oneL * 1000, priceLabel: "1L" };
  return { priceValue: 0, priceLabel: "N/A" };
}

export default function MenuPage() {
  const { addToCart } = useOrder();

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-3xl font-semibold">Menu</h1>
        <p className="mt-2" style={{ color: "rgb(var(--muted))" }}>
          Tambahkan ke keranjang dulu, lalu checkout isi data sekali.
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
                  {items.map((it) => {
                    const { priceValue, priceLabel: pLabel } = getDefaultPrice(it);

                    return (
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
                          onClick={() =>
                            addToCart({
                              name: it.name,
                              desc: it.desc,
                              qty: 1,
                              priceValue,
                              priceLabel: pLabel,
                            })
                          }
                          className="shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold hover:opacity-90"
                          style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
                        >
                          + Keranjang
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