export type CartItem = {
  key: string;
  name: string;
  desc?: string;
  priceValue: number;
  priceLabel: string;
  qty: number;
};

export function rupiah(n: number) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return "Rp " + v.toLocaleString("id-ID");
}