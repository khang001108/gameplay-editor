import type { ReactNode } from "react";
import { useUiStore } from "../../state/uiStore";

/** Bọc Sidebar/Inspector — ở desktop trong suốt (2 panel luôn hiện qua CSS), ở màn hình hẹp
 * trở thành drawer trượt vào/ra theo state trong uiStore (bấm ☰/⚙ trên TopBar để mở). */
export function Drawer({ side, children }: { side: "sidebar" | "inspector"; children: ReactNode }) {
  const open = useUiStore((s) => (side === "sidebar" ? s.sidebarOpen : s.inspectorOpen));
  return <div className={`drawer drawer--${side}${open ? " drawer--open" : ""}`}>{children}</div>;
}
