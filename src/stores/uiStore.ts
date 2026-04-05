import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  language: "en" | "id";
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setLanguage: (lang: "en" | "id") => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      language: "en",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({ language: state.language }), // only persist language
    }
  )
);

