import { useState } from "react";
import { useMapStore } from "../../../state/mapStore";

export function LayersPanel() {
  const layers = useMapStore((s) => s.layers);
  const activeLayerId = useMapStore((s) => s.activeLayerId);
  const setActiveLayer = useMapStore((s) => s.setActiveLayer);
  const addLayer = useMapStore((s) => s.addLayer);
  const removeLayer = useMapStore((s) => s.removeLayer);
  const renameLayer = useMapStore((s) => s.renameLayer);
  const toggleLayerVisibility = useMapStore((s) => s.toggleLayerVisibility);
  const moveLayerUp = useMapStore((s) => s.moveLayerUp);
  const moveLayerDown = useMapStore((s) => s.moveLayerDown);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // layers[] lưu theo thứ tự vẽ thật (đầu mảng = dưới cùng) — đảo ngược chỉ để HIỂN THỊ, cho layer
  // trên cùng nằm đầu danh sách (giống Tiled/Photoshop).
  const displayLayers = [...layers].reverse();

  const commitRename = (id: string) => {
    const name = editingName.trim();
    if (name) renameLayer(id, name);
    setEditingId(null);
  };

  return (
    <div className="map-sidebar__section">
      <div className="sidebar__hint">Layer trên cùng vẽ đè lên layer dưới. Chọn 1 layer (viền vàng) để Vẽ/Xoá tác động đúng layer đó.</div>

      <div className="layers-list">
        {displayLayers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          const index = layers.findIndex((l) => l.id === layer.id);
          return (
            <div key={layer.id} className={`layer-row${isActive ? " layer-row--active" : ""}`} onClick={() => setActiveLayer(layer.id)}>
              <button
                className="layer-row__icon-btn"
                title={layer.visible ? "Ẩn layer" : "Hiện layer"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
              >
                {layer.visible ? "👁" : "🚫"}
              </button>

              {editingId === layer.id ? (
                <input
                  className="field-input field-input--sm layer-row__name-input"
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => commitRename(layer.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(layer.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <span
                  className="layer-row__name"
                  title="Nhấp đúp để đổi tên"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(layer.id);
                    setEditingName(layer.name);
                  }}
                >
                  {layer.name}
                </span>
              )}

              <div className="layer-row__actions">
                <button
                  className="layer-row__icon-btn"
                  title="Đổi tên"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(layer.id);
                    setEditingName(layer.name);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="layer-row__icon-btn"
                  title="Đưa lên trên"
                  disabled={index === layers.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayerUp(layer.id);
                  }}
                >
                  ▲
                </button>
                <button
                  className="layer-row__icon-btn"
                  title="Đưa xuống dưới"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayerDown(layer.id);
                  }}
                >
                  ▼
                </button>
                <button
                  className="layer-row__icon-btn"
                  title="Xoá layer"
                  disabled={layers.length <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Xoá layer "${layer.name}"?`)) removeLayer(layer.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn--sm" onClick={addLayer}>
        + Thêm layer
      </button>
    </div>
  );
}
