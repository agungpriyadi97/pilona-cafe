"use client";

import { SITE } from "../data/site";

export default function StickyWA() {
  const url = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
    "Halo Pilona Coffee, saya mau pesan."
  )}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-[999] rounded-full px-4 py-3 text-sm font-semibold shadow-lg hover:opacity-90"
      style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
    >
      WhatsApp
    </a>
  );
}