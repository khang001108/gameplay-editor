import { create } from "zustand";
import { clamp } from "../utils/clamp";

const SIDEBAR_WIDTH_KEY = "game-editor-sidebar-width";
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;
const SIDEBAR_DEFAULT_WIDTH = 240;

const INSPECTOR_WIDTH_KEY = "game-editor-inspector-width";
export const INSPECTOR_MIN_WIDTH = 220;
export const INSPECTOR_MAX_WIDTH = 520;
const INSPECTOR_DEFAULT_WIDTH = 300;

function getInitialWidth(key: string, min: number, max: number, fallback: number): number {
  const saved = Number(window.localStorage.getItem(key));
  if (Number.isFinite(saved) && saved > 0) return clamp(saved, min, max);
  return fallback;
}

/** Trạng thái Sidebar/Inspector dạng drawer trượt trên màn hình hẹp — không có tác dụng gì ở
 * desktop (2 panel luôn hiện cố định qua CSS media query), chỉ cần cho layout điện thoại/tablet dọc. */
interface UiState {
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  sidebarWidth: number;
  inspectorWidth: number;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  closeDrawers: () => void;
  setSidebarWidth: (width: number) => void;
  setInspectorWidth: (width: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  inspectorOpen: false,
  sidebarWidth: getInitialWidth(SIDEBAR_WIDTH_KEY, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_DEFAULT_WIDTH),
  inspectorWidth: getInitialWidth(INSPECTOR_WIDTH_KEY, INSPECTOR_MIN_WIDTH, INSPECTOR_MAX_WIDTH, INSPECTOR_DEFAULT_WIDTH),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, inspectorOpen: false })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen, sidebarOpen: false })),
  closeDrawers: () => set({ sidebarOpen: false, inspectorOpen: false }),
  setSidebarWidth: (width) => {
    const next = clamp(width, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH);
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(next));
    set({ sidebarWidth: next });
  },
  setInspectorWidth: (width) => {
    const next = clamp(width, INSPECTOR_MIN_WIDTH, INSPECTOR_MAX_WIDTH);
    window.localStorage.setItem(INSPECTOR_WIDTH_KEY, String(next));
    set({ inspectorWidth: next });
  },
}));
