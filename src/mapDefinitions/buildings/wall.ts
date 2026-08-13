import type { MapObjectDefinition } from "../../types/mapDefs";

export const wallDef: MapObjectDefinition = {
  type: "wall",
  kind: "building",
  label: "Tường thành",
  description: "Chặn đường di chuyển, có thể bị phá.",
  color: "#a89a80",
  footprintWidth: 1,
  footprintHeight: 1,
  fields: [{ key: "hp", label: "Máu (HP)", kind: "number", default: 100, min: 1 }],
};
