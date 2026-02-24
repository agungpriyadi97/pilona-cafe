export type CartItem = {
  key: string; // unik
  name: string;
  desc?: string;
  priceValue: number; // rupiah
  qty: number;
};

export function rupiah(n: number) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return "Rp " + v.toLocaleString("id-ID");
}