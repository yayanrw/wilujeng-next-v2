import { create } from "zustand";

import { getTierPrice, type Tier } from "@/utils/tier-pricing";

export type PosProduct = {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  stock: number;
  tiers: Tier[];
};

export type CartItem = {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  stock: number;
  unitPrice: number;
  subtotal: number;
  tiers: Tier[];
  basePrice: number;
};

type PosState = {
  items: CartItem[];
  customerId: string | null;
  setCustomerId: (id: string | null) => void;
  addProduct: (p: PosProduct, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

function recalc(item: Omit<CartItem, "unitPrice" | "subtotal">): CartItem {
  const unitPrice = getTierPrice({
    basePrice: item.basePrice,
    qty: item.qty,
    tiers: item.tiers,
  });
  return { ...item, unitPrice, subtotal: unitPrice * item.qty };
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  customerId: null,
  setCustomerId: (id) => set({ customerId: id }),
  addProduct: (p, qty = 1) => {
    const items = get().items.slice();
    const idx = items.findIndex((i) => i.productId === p.id);
    if (idx >= 0) {
      const existing = items[idx];
      const nextQty = Math.min(existing.qty + qty, p.stock);
      items[idx] = recalc({ ...existing, qty: nextQty, stock: p.stock });
      set({ items });
      return;
    }

    const base: Omit<CartItem, "unitPrice" | "subtotal"> = {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      qty: Math.min(qty, p.stock),
      stock: p.stock,
      tiers: p.tiers,
      basePrice: p.basePrice,
    };
    set({ items: [...items, recalc(base)] });
  },
  setQty: (productId, qty) => {
    const items = get().items.slice();
    const idx = items.findIndex((i) => i.productId === productId);
    if (idx < 0) return;
    const item = items[idx];
    const nextQty = Math.max(1, Math.min(qty, item.stock));
    items[idx] = recalc({ ...item, qty: nextQty });
    set({ items });
  },
  removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
  clear: () => set({ items: [], customerId: null }),
}));

