import { useMapStore } from "../../../state/mapStore";
import type { MapTool } from "../../../state/mapStore";
import type { AreaKind } from "../../../types/map";

const AREA_KINDS: { id: AreaKind; label: string; hint: string }[] = [
  { id: "spawn", label: "Spawn Area", hint: "Điểm/khu vực xuất hiện quân" },
  { id: "trigger", label: "Trigger Area", hint: "Vùng kích hoạt sự kiện gameplay" },
  { id: "boundary", label: "Boundary", hint: "Giới hạn di chuyển / ranh giới map" },
];

export function AreaPanel() {
  const activeTool = useMapStore((s) => s.activeTool);
  const setActiveTool = useMapStore((s) => s.setActiveTool);
  const areas = useMapStore((s) => s.areas);
  const selected = useMapStore((s) => s.selected);
  const select = useMapStore((s) => s.select);

  return (
    <div className="map-sidebar__section">
      <div className="sidebar__hint">Chọn loại khu vực rồi kéo chuột trên canvas để vẽ hình chữ nhật.</div>

      <div className="palette-group__items">
        {AREA_KINDS.map((k) => {
          const toolId = `area-${k.id}` as MapTool;
          const isActive = activeTool === toolId;
          return (
            <button
              key={k.id}
              className={`palette-item map-area-btn${isActive ? " map-area-btn--active" : ""}`}
              title={k.hint}
              onClick={() => setActiveTool(isActive ? "select" : toolId)}
            >
              <span className={`map-area-dot map-area-dot--${k.id}`} />
              <span className="palette-item__label">{k.label}</span>
            </button>
          );
        })}
      </div>

      {areas.length > 0 && (
        <>
          <div className="sidebar__hint map-sidebar__section-title">Danh sách khu vực ({areas.length})</div>
          <div className="palette-group__items">
            {areas.map((a) => {
              const isSelected = selected?.type === "area" && selected.id === a.id;
              return (
                <button
                  key={a.id}
                  className={`palette-item map-area-btn${isSelected ? " map-area-btn--active" : ""}`}
                  onClick={() => select({ type: "area", id: a.id })}
                >
                  <span className={`map-area-dot map-area-dot--${a.kind}`} />
                  <span className="palette-item__label">{a.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
