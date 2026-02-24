import Navbar from "../app/components/Navbar";
import StickyWA from "../app/components/StickyWA";
import { SITE } from "../app/data/site";

const bestSellers = [
  { name: "Kopi Untukmu 2.0 Bold", desc: "Kopi susu gula aren — bold & balanced." },
  { name: "Iced Matcha Latte", desc: "Matcha creamy, segar, favorit banyak orang." },
  { name: "Iced Yuzu Honey", desc: "Fresh citrus — cocok buat cuaca panas." },
];

const gallery = [
  "/gallery/1.webp",
  "/gallery/2.webp",
  "/gallery/3.webp",
  "/gallery/4.webp",
  "/gallery/5.webp",
  "/gallery/6.webp",
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <StickyWA />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div
          className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] border"
          style={{ borderColor: "rgb(var(--border))" }}
        >
          {/* Background image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/hero.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: "scale(1.03)",
              filter: "saturate(1.05) contrast(1.05)",
            }}
          />

          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: "var(--heroOverlay)" }} />

          {/* Content */}
          <div className="relative p-6 sm:p-10 md:p-14">
            <div className="max-w-2xl">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold"
                style={{ color: "rgb(var(--heroTitle))" }}
              >
                {SITE.brand}
              </h1>

              <p
                className="mt-3 text-sm sm:text-base md:text-lg"
                style={{ color: "rgb(var(--heroDesc))" }}
              >
                Kopi, non-coffee, dan tempat nyaman untuk ngobrol. Outlet: {SITE.outlet}.
              </p>

              {/* tombol jadi wrap rapi di mobile */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
                <a
                  href="/menu"
                  className="btn-primary rounded-2xl px-5 py-3 text-sm font-semibold text-center"
                >
                  Lihat Menu
                </a>

                <a
                  href={SITE.gofood}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost rounded-2xl px-5 py-3 text-sm font-semibold text-center"
                >
                  Pesan via GoFood
                </a>

                <a
                  href="/kasir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost rounded-2xl px-5 py-3 text-sm font-semibold text-center"
                >
                  Dashboard Kasir
                </a>

                <a href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost rounded-2xl px-5 py-3 text-sm font-semibold text-center"
                >
                  Dashboard Admin
                </a>
              </div>

              {/* highlight jadi 1 kolom di mobile */}
              <div className="mt-8 sm:mt-10 grid gap-4 md:grid-cols-3">
                <Highlight title="Cozy & Minimal" desc="Indoor & outdoor, cocok kerja ringan." />
                <Highlight title="Best Seller" desc="Kopi Untukmu 2.0 Bold jadi favorit." />
                <Highlight title="Order Cepat" desc="Klik menu → isi data → kasir proses." />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* BEST SELLER */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Best Seller</h2>
            <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              Menu populer yang sering diorder.
            </p>
          </div>

          <a
            href="/menu"
            className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:opacity-90"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            Buka Menu
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {bestSellers.map((m) => (
            <div
              key={m.name}
              className="rounded-3xl border p-6"
              style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}
            >
              <div className="text-lg font-semibold">{m.name}</div>
              <div className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
                {m.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <h2 className="text-2xl font-semibold">Gallery</h2>
        <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Suasana & signature drinks.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {gallery.map((src) => (
            <div
              key={src}
              className="overflow-hidden rounded-3xl border"
              style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}
            >
              <img src={src} alt="Pilona Gallery" className="h-56 w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* MAPS */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-semibold">Lokasi</h2>
        <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Pilona Coffee – {SITE.outlet}
        </p>

        <div
          className="mt-6 overflow-hidden rounded-3xl border"
          style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}
        >
          <iframe
            src={SITE.mapsEmbed}
            width="100%"
            height="420"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-10" style={{ borderColor: "rgb(var(--border))" }}>
        <div className="mx-auto max-w-6xl px-5 text-sm" style={{ color: "rgb(var(--muted))" }}>
          © {new Date().getFullYear()} {SITE.brand}. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function Highlight({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className="rounded-3xl border p-6"
      style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
        {desc}
      </div>
    </div>
  );
}