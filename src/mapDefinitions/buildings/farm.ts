import type { MapObjectDefinition } from "../../types/mapDefs";

export const farmDef: MapObjectDefinition = {
  type: "farm",
  kind: "building",
  label: "Nông trại",
  description: "Công trình sinh ra lương thực theo thời gian.",
  color: "#c9a04e",
  footprintWidth: 2,
  footprintHeight: 2,
  fields: [
    { key: "side", label: "Phe", kind: "select", default: "player", options: [
      { value: "player", label: "Người chơi" },
      { value: "enemy", label: "Địch" },
    ]},
    { key: "foodPerMinute", label: "Lương thực / phút", kind: "number", default: 10, min: 0 },
  ],
};
