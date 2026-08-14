import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";
import { useUiStore } from "../../state/uiStore";

/** Bọc Sidebar/Inspector — ở desktop trong suốt (2 panel luôn hiện qua CSS), ở màn hình hẹp
 * trở thành drawer trượt vào/ra theo state trong uiStore (bấm ☰/⚙ trên TopBar để mở).
 * Panel "sidebar" (toolbox bên trái) kéo giãn/thu hẹp được qua tay cầm ở cạnh phải. */
export function Drawer({ side, children }: { side: "sidebar" | "inspector"; children: ReactNode }) {
  const open = useUiStore((s) => (side === "sidebar" ? s.sidebarOpen : s.inspectorOpen));
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragState.current = { startX: e.clientX, startWidth: sidebarWidth };

    const handleMove = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const delta = ev.clientX - dragState.current.startX;
      setSidebarWidth(dragState.current.startWidth + delta);
    };
    const handleUp = () => {
      dragState.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.classList.remove("resizing-sidebar");
    };
    document.body.classList.add("resizing-sidebar");
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const style = side === "sidebar" ? ({ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties) : undefined;

  return (
    <div className={`drawer drawer--${side}${open ? " drawer--open" : ""}`} style={style}>
      {children}
      {side === "sidebar" && (
        <div
          className="sidebar-resizer"
          onPointerDown={handlePointerDown}
          onDoubleClick={() => setSidebarWidth(240)}
        />
      )}
    </div>
  );
}
