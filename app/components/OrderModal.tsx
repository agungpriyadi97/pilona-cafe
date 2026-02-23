"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderDB } from "../lib/orderDb";

export type OrderType = "DINE_IN" | "TAKE_AWAY";

export type OrderModalItem = {
  name: string;
  desc?: string;
  price?: number;
  qty?: number;
};

function formatRupiah(n?: number) {
  const value = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return "Rp " + value.toLocaleString("id-ID");
}

function onlyDigits(s: string) {
  return s.replace(/[^\d]/g, "");
}

function IconCup() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 8h10v6a5 5 0 0 1-5 5H9a3 3 0 0 1-3-3V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 9h2a3 3 0 0 1 0 6h-2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 3v2M12 3v2M16 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 8V7a5 5 0 0 1 10 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 8h12l-1 13H7L6 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12v0M15 12v0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden="true">
      <circle cx="42" cy="42" r="30" stroke="#22c55e" strokeWidth="6" opacity="0.25" />
      <path
        d="M28 43.5l9 9 19-22"
        stroke="#22c55e"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function OrderModal({
  isOpen,
  item,
  onClose,
}: {
  isOpen: boolean;
  item: OrderModalItem | null;
  onClose: () => void;
}) {

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<OrderType>("DINE_IN");

  const [submitting, setSubmitting] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null); // kalau ada -> tampil success screen

  // turunan data item (AMAN meskipun item null)
  const safeItem = item ?? { name: "", desc: "", price: 0, qty: 1 };
  const qty = safeItem.qty ?? 1;
  const price = typeof safeItem.price === "number" && Number.isFinite(safeItem.price) ? safeItem.price : 0;

  const total = useMemo(() => price * qty, [price, qty]);

  const canSubmit = useMemo(() => {
    if (!isOpen || !item) return false;
    if (name.trim().length < 2) return false;
    if (onlyDigits(phone).length < 9) return false;
    return true;
  }, [isOpen, item, name, phone]);

  // reset form saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setPhone("");
    setType("DINE_IN");
    setSubmitting(false);
    setSuccessName(null);
  }, [isOpen]);

  // auto redirect ke kasir setelah success
  useEffect(() => {
    if (!successName) return;
    const t = setTimeout(() => {
      onClose(); // cukup tutup modal, customer stay di halaman menu/home
    }, 1300);
    return () => clearTimeout(t);
  }, [successName, onClose]);

  async function submit() {
    if (!canSubmit || submitting || !item) return;
    setSubmitting(true);

    try {
      await createOrderDB({
        customerName: name.trim(),
        customerPhone: onlyDigits(phone),
        orderType: type,
        items: [
          {
            name: item.name,
            priceLabel: formatRupiah(price),
            priceValue: price, // penting untuk laporan & chart
            qty: item.qty ?? 1,
          },
        ],
      });

      // tampilkan success UI dulu
      setSuccessName(name.trim());
    } finally {
      setSubmitting(false);
    }
  }

  // Render null SETELAH semua hooks dipanggil
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4 sm:p-6">
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close backdrop"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />

      {/* modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-semibold text-neutral-900">Pesan Menu</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="h-px bg-neutral-200" />

        {/* BODY: kalau sukses, tampilkan success screen */}
        {successName ? (
          <div className="px-6 py-12 text-center">
            <div className="flex justify-center">
              <SuccessIcon />
            </div>
            <div className="mt-6 text-xl font-semibold text-neutral-900">Pesanan Berhasil!</div>
            <div className="mt-2 text-sm text-neutral-600">
              Terima kasih <b>{successName}</b>, pesanan Anda sedang diproses.
            </div>
            <div className="mt-6 text-xs text-neutral-500">Mengalihkan ke dashboard kasir...</div>
          </div>
        ) : (
          <div className="px-6 py-5">
            {/* item card */}
            <div className="rounded-xl bg-neutral-100 p-4">
              <div className="font-semibold text-neutral-900">{item.name}</div>
              {item.desc ? <div className="mt-1 text-sm text-neutral-600">{item.desc}</div> : null}
              <div className="mt-2 text-lg font-semibold text-neutral-900">{formatRupiah(price)}</div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-900">Nama Lengkap</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900">Nomor HP / WhatsApp</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
                />
                <p className="mt-2 text-xs text-neutral-500">*Minimal 9 digit</p>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900">Jenis Pesanan</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("DINE_IN")}
                    className="rounded-xl border p-4 text-left transition"
                    style={{
                      borderColor: type === "DINE_IN" ? "#111827" : "#E5E7EB",
                      background: type === "DINE_IN" ? "#F3F4F6" : "#FFFFFF",
                    }}
                  >
                    <div className="flex items-center gap-2 text-neutral-900">
                      <IconCup />
                      <div className="font-semibold">Dine In</div>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">Makan di tempat</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("TAKE_AWAY")}
                    className="rounded-xl border p-4 text-left transition"
                    style={{
                      borderColor: type === "TAKE_AWAY" ? "#111827" : "#E5E7EB",
                      background: type === "TAKE_AWAY" ? "#F3F4F6" : "#FFFFFF",
                    }}
                  >
                    <div className="flex items-center gap-2 text-neutral-900">
                      <IconBag />
                      <div className="font-semibold">Take Away</div>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">Bawa pulang</div>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || submitting}
                className={[
                  "mt-2 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
                  (!canSubmit || submitting)
                    ? "bg-neutral-400 cursor-not-allowed pointer-events-none"
                    : "bg-neutral-900 hover:opacity-95",
                ].join(" ")}
              >
                {submitting ? "Mengirim..." : `Kirim Pesanan - ${formatRupiah(total)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}