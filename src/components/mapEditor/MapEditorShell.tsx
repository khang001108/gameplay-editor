import { MapSidebar } from "./sidebar/MapSidebar";
import { MapCanvas } from "./canvas/MapCanvas";
import { MapInspector } from "./inspector/MapInspector";
import { TilePickerPanel } from "./inspector/TilePickerPanel";
import { TilesetGalleryPopup } from "./sidebar/TilesetGalleryPopup";
import { Drawer } from "../layout/Drawer";
import { useMapStore } from "../../state/mapStore";

export function MapEditorShell() {
  const warnings = useMapStore((s) => s.lastLoadWarnings);
  // đang vẽ terrain thì panel phải hiện bảng chọn tile thay vì Inspector (đỡ phải nhảy qua sidebar
  // trái mỗi lần đổi tile) — tool khác thì panel phải trở lại đúng vai trò cũ (sửa thuộc tính).
  const isPaintingTerrain = useMapStore((s) => s.activeTool === "terrain");

  return (
    <>
      <Drawer side="sidebar">
        <MapSidebar />
      </Drawer>
      <main className="app-shell__canvas">
        <MapCanvas />
        {warnings.length > 0 && (
          <div className="load-warnings">
            {warnings.map((w, i) => (
              <div key={i}>⚠ {w}</div>
            ))}
          </div>
        )}
      </main>
      <Drawer side="inspector">{isPaintingTerrain ? <TilePickerPanel /> : <MapInspector />}</Drawer>
      <TilesetGalleryPopup />
    </>
  );
}
