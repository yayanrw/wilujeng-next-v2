import { create } from 'zustand';

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  totalDebt: number;
};

type CustomerState = {
  customers: CustomerRow[];
  loaded: boolean;
  setCustomers: (customers: CustomerRow[]) => void;
  addCustomer: (customer: CustomerRow) => void;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  loaded: false,
  setCustomers: (customers) => set({ customers, loaded: true }),
  addCustomer: (customer) =>
    set((s) => ({
      customers: [...s.customers, customer].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    })),
}));
