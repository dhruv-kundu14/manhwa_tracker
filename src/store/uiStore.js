import { create } from 'zustand'

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null,   // 'addManhwa' | 'editEntry' | 'share' | null
  modalData:   null,   // payload passed to the active modal

  toggleSidebar:  ()           => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal:      (name, data) => set({ activeModal: name, modalData: data ?? null }),
  closeModal:     ()           => set({ activeModal: null, modalData: null }),
}))
