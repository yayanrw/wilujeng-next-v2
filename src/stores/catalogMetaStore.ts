import { create } from 'zustand';

export type CatalogTerm = { id: string; name: string };

type CatalogMetaState = {
  categories: CatalogTerm[];
  brands: CatalogTerm[];
  suppliers: CatalogTerm[];
  loaded: boolean;
  setCategories: (categories: CatalogTerm[]) => void;
  setBrands: (brands: CatalogTerm[]) => void;
  setSuppliers: (suppliers: CatalogTerm[]) => void;
  setLoaded: (loaded: boolean) => void;
  addCategory: (category: CatalogTerm) => void;
  addBrand: (brand: CatalogTerm) => void;
  addSupplier: (supplier: CatalogTerm) => void;
};

const upsertSorted = (list: CatalogTerm[], item: CatalogTerm) =>
  list.some((x) => x.name.toLowerCase() === item.name.toLowerCase())
    ? list
    : [...list, item].sort((a, b) => a.name.localeCompare(b.name));

export const useCatalogMetaStore = create<CatalogMetaState>((set) => ({
  categories: [],
  brands: [],
  suppliers: [],
  loaded: false,
  setCategories: (categories) => set({ categories }),
  setBrands: (brands) => set({ brands }),
  setSuppliers: (suppliers) => set({ suppliers }),
  setLoaded: (loaded) => set({ loaded }),
  addCategory: (category) =>
    set((s) => ({ categories: upsertSorted(s.categories, category) })),
  addBrand: (brand) => set((s) => ({ brands: upsertSorted(s.brands, brand) })),
  addSupplier: (supplier) =>
    set((s) => ({ suppliers: upsertSorted(s.suppliers, supplier) })),
}));
