import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";
import { useUiStore } from "../../state/uiStore";

const SIDEBAR_DEFAULT_WIDTH = 240;
const INSPECTOR_DEFAULT_WIDTH = 300;

/** Bọc Sidebar/Inspector — ở desktop trong suốt (2 panel luôn hiện qua CSS), ở màn hình hẹp
 * trở thành drawer trượt vào/ra theo state trong uiStore (bấm ☰/⚙ trên TopBar để mở).
 * Cả 2 panel đều kéo giãn/thu hẹp được qua tay cầm ở cạnh giáp canvas — sidebar (trái) kéo ở cạnh
 * phải, inspector (phải) kéo ở cạnh trái, nên chiều kéo tăng width của 2 bên ngược nhau. */
export function Drawer({ side, children }: { side: "sidebar" | "inspector"; children: ReactNode }) {
  const open = useUiStore((s) => (side === "sidebar" ? s.sidebarOpen : s.inspectorOpen));
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const inspectorWidth = useUiStore((s) => s.inspectorWidth);
  const setInspectorWidth = useUiStore((s) => s.setInspectorWidth);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  const width = side === "sidebar" ? sidebarWidth : inspectorWidth;
  const setWidth = side === "sidebar" ? setSidebarWidth : setInspectorWidth;
  // sidebar (trái): kéo sang phải (dx dương) mới giãn ra. inspector (phải): kéo sang trái (dx âm) mới giãn ra.
  const dragSign = side === "sidebar" ? 1 : -1;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragState.current = { startX: e.clientX, startWidth: width };

    const handleMove = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const delta = (ev.clientX - dragState.current.startX) * dragSign;
      setWidth(dragState.current.startWidth + delta);
    };
    const handleUp = () => {
      dragState.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.classList.remove("resizing-panel");
    };
    document.body.classList.add("resizing-panel");
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const cssVar = side === "sidebar" ? "--sidebar-width" : "--inspector-width";
  const style = { [cssVar]: `${width}px` } as CSSProperties;
  const resetWidth = side === "sidebar" ? SIDEBAR_DEFAULT_WIDTH : INSPECTOR_DEFAULT_WIDTH;

  const resizer = (
    <div
      key="resizer"
      className={`panel-resizer panel-resizer--${side}`}
      onPointerDown={handlePointerDown}
      onDoubleClick={() => setWidth(resetWidth)}
    />
  );

  return (
    <div className={`drawer drawer--${side}${open ? " drawer--open" : ""}`} style={style}>
      {side === "inspector" && resizer}
      {children}
      {side === "sidebar" && resizer}
    </div>
  );
}
