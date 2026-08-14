import { create } from "zustand";

/** Trạng thái Sidebar/Inspector dạng drawer trượt trên màn hình hẹp — không có tác dụng gì ở
 * desktop (2 panel luôn hiện cố định qua CSS media query), chỉ cần cho layout điện thoại/tablet dọc. */
interface UiState {
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  closeDrawers: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  inspectorOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, inspectorOpen: false })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen, sidebarOpen: false })),
  closeDrawers: () => set({ sidebarOpen: false, inspectorOpen: false }),
}));
