import { create } from 'zustand';

export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  categoryId: string | null;
  basePrice: number;
  tiers: { minQty: number; price: number }[];
};

type CatalogState = {
  products: CatalogProduct[];
  stocks: Record<string, number>; // Map productId -> stock
  loading: boolean;
  lastStockUpdate: number;
  setProducts: (products: CatalogProduct[]) => void;
  updateStocks: (stockList: { id: string; stock: number }[]) => void;
  setLoading: (loading: boolean) => void;
};

export const useCatalogStore = create<CatalogState>((set) => ({
  products: [],
  stocks: {},
  loading: false,
  lastStockUpdate: 0,
  setProducts: (products) => set({ products, loading: false }),
  updateStocks: (stockList) => {
    const stockMap = stockList.reduce((acc, item) => {
      acc[item.id] = item.stock;
      return acc;
    }, {} as Record<string, number>);
    set({ stocks: stockMap, lastStockUpdate: Date.now() });
  },
  setLoading: (loading) => set({ loading }),
}));
