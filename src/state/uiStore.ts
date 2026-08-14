import { create } from "zustand";
import { clamp } from "../utils/clamp";

const SIDEBAR_WIDTH_KEY = "game-editor-sidebar-width";
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;
const SIDEBAR_DEFAULT_WIDTH = 240;

function getInitialSidebarWidth(): number {
  const saved = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
  if (Number.isFinite(saved) && saved > 0) return clamp(saved, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH);
  return SIDEBAR_DEFAULT_WIDTH;
}

/** Trạng thái Sidebar/Inspector dạng drawer trượt trên màn hình hẹp — không có tác dụng gì ở
 * desktop (2 panel luôn hiện cố định qua CSS media query), chỉ cần cho layout điện thoại/tablet dọc. */
interface UiState {
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  closeDrawers: () => void;
  setSidebarWidth: (width: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  inspectorOpen: false,
  sidebarWidth: getInitialSidebarWidth(),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, inspectorOpen: false })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen, sidebarOpen: false })),
  closeDrawers: () => set({ sidebarOpen: false, inspectorOpen: false }),
  setSidebarWidth: (width) => {
    const next = clamp(width, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH);
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(next));
    set({ sidebarWidth: next });
  },
}));
