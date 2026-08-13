import { useMapStore } from "../../../state/mapStore";
import { getMapObjectDefinition } from "../../../mapDefinitions";
import { TextField } from "../../inspector/fields/TextField";
import { NumberField } from "../../inspector/fields/NumberField";
import { SelectField } from "../../inspector/fields/SelectField";
import type { FieldValue } from "../../../types/graph";
import type { AreaTeam } from "../../../types/map";

const TEAM_OPTIONS = [
  { value: "", label: "— Không chọn —" },
  { value: "player", label: "Người chơi" },
  { value: "enemy", label: "Địch" },
  { value: "neutral", label: "Trung lập" },
];

const AREA_KIND_LABEL: Record<string, string> = {
  spawn: "Spawn Area",
  trigger: "Trigger Area",
  boundary: "Boundary",
};

export function MapInspector() {
  const selected = useMapStore((s) => s.selected);
  const objects = useMapStore((s) => s.objects);
  const areas = useMapStore((s) => s.areas);
  const updateObjectField = useMapStore((s) => s.updateObjectField);
  const moveObject = useMapStore((s) => s.moveObject);
  const removeObject = useMapStore((s) => s.removeObject);
  const updateArea = useMapStore((s) => s.updateArea);
  const removeArea = useMapStore((s) => s.removeArea);

  const width = useMapStore((s) => s.width);
  const height = useMapStore((s) => s.height);
  const tileSize = useMapStore((s) => s.tileSize);
  const resizeMap = useMapStore((s) => s.resizeMap);
  const setTileSize = useMapStore((s) => s.setTileSize);
  const tilesetsCount = useMapStore((s) => s.tilesets.length);
  const objectsCount = objects.length;
  const areasCount = areas.length;

  if (selected?.type === "object") {
    const obj = objects.find((o) => o.id === selected.id);
    const def = obj ? getMapObjectDefinition(obj.defType) : undefined;
    if (!obj || !def) {
      return (
        <aside className="inspector">
          <div className="inspector__empty">Không rõ loại object này (định nghĩa đã bị xoá khỏi registry).</div>
        </aside>
      );
    }
    const handleChange = (key: string, value: FieldValue) => updateObjectField(obj.id, key, value);

    return (
      <aside className="inspector" style={{ "--accent": def.color } as React.CSSProperties}>
        <div className="inspector__header">
          <span className="inspector__category">{def.kind === "building" ? "Building" : "Unit"}</span>
          <h2 className="inspector__title">{def.label}</h2>
          <p className="inspector__desc">{def.description}</p>
        </div>

        <div className="inspector__fields">
          <div className="field-row">
            <label className="field-row__label">Vị trí X (ô)</label>
            <NumberField field={{ key: "x", label: "X", kind: "number", default: 0 }} value={obj.x} onChange={(v) => moveObject(obj.id, v, obj.y)} />
          </div>
          <div className="field-row">
            <label className="field-row__label">Vị trí Y (ô)</label>
            <NumberField field={{ key: "y", label: "Y", kind: "number", default: 0 }} value={obj.y} onChange={(v) => moveObject(obj.id, obj.x, v)} />
          </div>

          {def.fields.map((field) => {
            const value = obj.values[field.key];
            return (
              <div className="field-row" key={field.key}>
                <label className="field-row__label">{field.label}</label>
                {field.kind === "text" && (
                  <TextField field={field} value={String(value ?? "")} onChange={(v) => handleChange(field.key, v)} />
                )}
                {field.kind === "number" && (
                  <NumberField field={field} value={Number(value ?? 0)} onChange={(v) => handleChange(field.key, v)} />
                )}
                {field.kind === "select" && (
                  <SelectField field={field} value={String(value ?? "")} onChange={(v) => handleChange(field.key, v)} />
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn--danger" onClick={() => removeObject(obj.id)}>
          Xoá {def.kind === "building" ? "công trình" : "unit"}
        </button>
      </aside>
    );
  }

  if (selected?.type === "area") {
    const area = areas.find((a) => a.id === selected.id);
    if (!area) {
      return (
        <aside className="inspector">
          <div className="inspector__empty">Khu vực không còn tồn tại.</div>
        </aside>
      );
    }

    return (
      <aside className="inspector">
        <div className="inspector__header">
          <span className="inspector__category">{AREA_KIND_LABEL[area.kind]}</span>
          <h2 className="inspector__title">{area.name}</h2>
        </div>

        <div className="inspector__fields">
          <div className="field-row">
            <label className="field-row__label">Tên</label>
            <TextField field={{ key: "name", label: "Tên", kind: "text", default: "" }} value={area.name} onChange={(v) => updateArea(area.id, { name: v })} />
          </div>
          <div className="field-row">
            <label className="field-row__label">Phe</label>
            <SelectField
              field={{ key: "team", label: "Phe", kind: "select", default: "", options: TEAM_OPTIONS }}
              value={area.team}
              onChange={(v) => updateArea(area.id, { team: v as AreaTeam })}
            />
          </div>
          <div className="field-row">
            <label className="field-row__label">X (ô)</label>
            <NumberField field={{ key: "x", label: "X", kind: "number", default: 0 }} value={area.x} onChange={(v) => updateArea(area.id, { x: v })} />
          </div>
          <div className="field-row">
            <label className="field-row__label">Y (ô)</label>
            <NumberField field={{ key: "y", label: "Y", kind: "number", default: 0 }} value={area.y} onChange={(v) => updateArea(area.id, { y: v })} />
          </div>
          <div className="field-row">
            <label className="field-row__label">Rộng (ô)</label>
            <NumberField field={{ key: "width", label: "Rộng", kind: "number", default: 1, min: 1 }} value={area.width} onChange={(v) => updateArea(area.id, { width: v })} />
          </div>
          <div className="field-row">
            <label className="field-row__label">Cao (ô)</label>
            <NumberField field={{ key: "height", label: "Cao", kind: "number", default: 1, min: 1 }} value={area.height} onChange={(v) => updateArea(area.id, { height: v })} />
          </div>
        </div>

        <button className="btn btn--danger" onClick={() => removeArea(area.id)}>
          Xoá khu vực
        </button>
      </aside>
    );
  }

  return (
    <aside className="inspector">
      <div className="inspector__empty">Chọn 1 công trình / unit / khu vực trên canvas để chỉnh thuộc tính.</div>

      <div className="inspector__header inspector__header--tight">
        <span className="inspector__category">Map Settings</span>
      </div>
      <div className="inspector__fields">
        <div className="field-row">
          <label className="field-row__label">Rộng (ô)</label>
          <NumberField field={{ key: "width", label: "Rộng", kind: "number", default: 20, min: 1 }} value={width} onChange={(v) => resizeMap(v, height)} />
        </div>
        <div className="field-row">
          <label className="field-row__label">Cao (ô)</label>
          <NumberField field={{ key: "height", label: "Cao", kind: "number", default: 15, min: 1 }} value={height} onChange={(v) => resizeMap(width, v)} />
        </div>
        <div className="field-row">
          <label className="field-row__label">Kích thước ô hiển thị (px)</label>
          <NumberField field={{ key: "tileSize", label: "Tile size", kind: "number", default: 32, min: 4 }} value={tileSize} onChange={setTileSize} />
        </div>
      </div>

      <div className="inspector__meta inspector__meta--tight">
        <span>
          {tilesetsCount} tileset · {objectsCount} object · {areasCount} khu vực
        </span>
      </div>
    </aside>
  );
}
