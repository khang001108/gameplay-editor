import { useMapStore } from "../../../state/mapStore";
import { useUiStore } from "../../../state/uiStore";
import { LayersPanel } from "./LayersPanel";

export function TerrainPanel() {
  const tilesetsCount = useMapStore((s) => s.tilesets.length);
  const toggleTilesetGallery = useUiStore((s) => s.toggleTilesetGallery);

  return (
    <div className="map-sidebar__section">
      <LayersPanel />

      <div className="map-sidebar__divider" />

      <div className="sidebar__hint">
        Import tileset và chọn tile để vẽ trong popup "Quản lý Tileset" — bảng chọn ô sẽ hiện ở panel bên phải lúc đang vẽ.
      </div>

      <button className="btn" onClick={toggleTilesetGallery}>
        🗂 Quản lý Tileset{tilesetsCount > 0 ? ` (${tilesetsCount})` : ""}
      </button>
    </div>
  );
}
