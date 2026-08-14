import { getMapObjectDefinitionsByKind } from "../../../mapDefinitions";
import type { MapObjectKind } from "../../../types/mapDefs";
import { useMapStore } from "../../../state/mapStore";
import { useUiStore } from "../../../state/uiStore";

export function ObjectPalette({ kind }: { kind: MapObjectKind }) {
  const items = getMapObjectDefinitionsByKind(kind);
  const pendingPlacement = useMapStore((s) => s.pendingPlacement);
  const activeTool = useMapStore((s) => s.activeTool);
  const armPlacement = useMapStore((s) => s.armPlacement);
  const cancelPlacement = useMapStore((s) => s.cancelPlacement);
  const closeDrawers = useUiStore((s) => s.closeDrawers);

  return (
    <div className="map-sidebar__section">
      <div className="sidebar__hint">
        Bấm 1 {kind === "building" ? "công trình" : "quân"} rồi chạm/click vào canvas để đặt lên map.
      </div>
      <div className="palette-group__items">
        {items.map((def) => {
          const isArmed = activeTool === "place-object" && pendingPlacement?.defType === def.type;
          return (
            <button
              key={def.type}
              type="button"
              className={`palette-item map-palette-item${isArmed ? " map-palette-item--armed" : ""}`}
              onClick={() => {
                if (isArmed) cancelPlacement();
                else {
                  armPlacement(def.type);
                  closeDrawers();
                }
              }}
              title={def.description}
              style={{ "--accent": def.color } as React.CSSProperties}
            >
              <span className="palette-item__dot" />
              <span className="palette-item__label">{def.label}</span>
              <span className="map-palette-item__size">
                {def.footprintWidth}×{def.footprintHeight}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
