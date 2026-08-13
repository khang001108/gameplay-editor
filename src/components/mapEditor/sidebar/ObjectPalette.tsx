import { getMapObjectDefinitionsByKind } from "../../../mapDefinitions";
import type { MapObjectKind } from "../../../types/mapDefs";
import { NEW_MAP_OBJECT_MIME } from "../dragTypes";

export function ObjectPalette({ kind }: { kind: MapObjectKind }) {
  const items = getMapObjectDefinitionsByKind(kind);

  const handleDragStart = (e: React.DragEvent, defType: string) => {
    e.dataTransfer.setData(NEW_MAP_OBJECT_MIME, defType);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="map-sidebar__section">
      <div className="sidebar__hint">
        Kéo {kind === "building" ? "công trình" : "quân"} vào canvas để đặt lên map.
      </div>
      <div className="palette-group__items">
        {items.map((def) => (
          <div
            key={def.type}
            className="palette-item map-palette-item"
            draggable
            onDragStart={(e) => handleDragStart(e, def.type)}
            title={def.description}
            style={{ "--accent": def.color } as React.CSSProperties}
          >
            <span className="palette-item__dot" />
            <span className="palette-item__label">{def.label}</span>
            <span className="map-palette-item__size">
              {def.footprintWidth}×{def.footprintHeight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
