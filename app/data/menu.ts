export type Price = { r?: number; l?: number; xl?: number; oneL?: number };

export type MenuItem = {
  name: string;
  desc?: string;
  badge?: "Best Seller" | "Recommended";
  category:
    | "Kopi Untukmu"
    | "Coffee"
    | "Non-Coffee"
    | "Oreo Regal Series"
    | "Paket"
    | "Add-On";
  price?: Price;        // untuk menu size (R/L/XL/1L)
  singlePrice?: number; // untuk paket/add-on (dalam ribuan, contoh 105 = 105K)
};

export const MENU: MenuItem[] = [
  {
    category: "Kopi Untukmu",
    name: "Kopi Untukmu 2.0 Bold",
    desc: "Kopi susu gula aren — bold & balanced.",
    badge: "Best Seller",
    price: { r: 23, l: 29, xl: 58, oneL: 100 },
  },
  {
    category: "Kopi Untukmu",
    name: "Kopi Untukmu 3.0 Magic",
    desc: "Creamy & bold (signature).",
    badge: "Recommended",
    price: { r: 30 },
  },

  { category: "Coffee", name: "Iced Rum Coffee", price: { r: 22, l: 28 } },
  { category: "Coffee", name: "Iced Mocha Latte", price: { r: 27, l: 35 } },
  { category: "Coffee", name: "Iced Coffee Matcha Latte", price: { r: 27, l: 35 } },
  { category: "Coffee", name: "Iced Rum Coffee Latte", price: { r: 27, l: 35, xl: 68, oneL: 115 } },
  { category: "Coffee", name: "Iced Coffee Jelly", price: { r: 27, l: 35, xl: 68, oneL: 115 } },
  { category: "Coffee", name: "Iced Pandan Coffee Latte", price: { r: 27, l: 35, xl: 68, oneL: 115 } },
  { category: "Coffee", name: "Affogato", price: { r: 28 } },

  { category: "Non-Coffee", name: "Iced Lemon Tea", price: { r: 17 } },
  { category: "Non-Coffee", name: "Fresh Milk with Coffee Jelly", price: { r: 24, l: 32 } },
  { category: "Non-Coffee", name: "Iced Taro Latte", price: { r: 26, l: 32 } },
  { category: "Non-Coffee", name: "Iced Choco Latte", price: { r: 26, l: 32, xl: 60, oneL: 105 } },
  { category: "Non-Coffee", name: "Iced Matcha Latte", price: { r: 26, l: 32, xl: 60, oneL: 105 } },
  { category: "Non-Coffee", name: "Iced Hojicha Latte", price: { r: 26, l: 32, xl: 60, oneL: 105 } },
  { category: "Non-Coffee", name: "Iced Yuzu Honey", price: { r: 27, l: 35 } },

  { category: "Oreo Regal Series", name: "Cookies N' Cream", price: { r: 30, l: 38 } },
  { category: "Oreo Regal Series", name: "Oreo/Regal/Oreal Shake", price: { r: 23, l: 29 } },
  { category: "Oreo Regal Series", name: "Oreo/Regal/Oreal Rum Shake", price: { r: 25, l: 31 } },
  { category: "Oreo Regal Series", name: "Oreo/Regal/Oreal Coffee Latte", price: { r: 26, l: 32 } },

  { category: "Paket", name: "Paket Ngopi Bareng 1 Genk", desc: "6 cup Kopi Untukmu 2.0 Bold", singlePrice: 105 },
  { category: "Paket", name: "Paket Ngopi Bareng 1 Kantor", desc: "8 cup Kopi Untukmu 2.0 Bold", singlePrice: 165 },
  { category: "Paket", name: "Paket Ngopi Bareng 1 RT", desc: "12 cup Kopi Untukmu 2.0 Bold", singlePrice: 235 },

  { category: "Add-On", name: "Xtra Shot", singlePrice: 3 },
  { category: "Add-On", name: "1 Shot Espresso", singlePrice: 5 },
  { category: "Add-On", name: "Syrup (Pump)", singlePrice: 5 },
  { category: "Add-On", name: "Oreo Crumb", singlePrice: 5 },
  { category: "Add-On", name: "Regal", singlePrice: 6 },
  { category: "Add-On", name: "Coffee Jelly", singlePrice: 6 },
  { category: "Add-On", name: "Ice Cream", singlePrice: 10 },
  { category: "Add-On", name: "Oatmilk (tukar susu)", singlePrice: 10 },
];