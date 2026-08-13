import type { MapObjectDefinition } from "../../types/mapDefs";

export const goldMineDef: MapObjectDefinition = {
  type: "gold_mine",
  kind: "building",
  label: "Mỏ vàng",
  description: "Tài nguyên vàng khai thác được, có giới hạn trữ lượng.",
  color: "#e0c34a",
  footprintWidth: 2,
  footprintHeight: 2,
  fields: [{ key: "goldAmount", label: "Trữ lượng vàng", kind: "number", default: 500, min: 0 }],
};
