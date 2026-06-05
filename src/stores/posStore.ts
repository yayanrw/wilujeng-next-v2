import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export type HeldCart = {
  id: string;
  items: CartItem[];
  customerId: string | null;
  customerName?: string;
  heldAt: string;
};

const MAX_HOLDS = 10;

type PosState = {
  items: CartItem[];
  customerId: string | null;
  holds: HeldCart[];
  setCustomerId: (id: string | null) => void;
  addProduct: (p: PosProduct, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  holdCurrentCart: (customerName?: string) => boolean;
  recallHold: (id: string) => void;
  discardHold: (id: string) => void;
};

function recalc(item: Omit<CartItem, "unitPrice" | "subtotal">): CartItem {
  const unitPrice = getTierPrice({
    basePrice: item.basePrice,
    qty: item.qty,
    tiers: item.tiers,
  });
  return { ...item, unitPrice, subtotal: unitPrice * item.qty };
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      holds: [],

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

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      clear: () => set({ items: [], customerId: null }),

      // Returns false if holds are full
      holdCurrentCart: (customerName?: string) => {
        const { items, customerId, holds } = get();
        if (!items.length) return false;
        if (holds.length >= MAX_HOLDS) return false;
        const hold: HeldCart = {
          id: crypto.randomUUID(),
          items,
          customerId,
          customerName,
          heldAt: new Date().toISOString(),
        };
        set({ holds: [...holds, hold], items: [], customerId: null });
        return true;
      },

      recallHold: (id: string) => {
        const { holds } = get();
        const hold = holds.find((h) => h.id === id);
        if (!hold) return;
        set({
          items: hold.items,
          customerId: hold.customerId,
          holds: holds.filter((h) => h.id !== id),
        });
      },

      discardHold: (id: string) =>
        set({ holds: get().holds.filter((h) => h.id !== id) }),
    }),
    {
      name: "pos-holds",
      partialize: (state) => ({ holds: state.holds }),
    },
  ),
);
