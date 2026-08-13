import type { MapObjectDefinition } from "../../types/mapDefs";

export const townhallDef: MapObjectDefinition = {
  type: "townhall",
  kind: "building",
  label: "Toà thị chính",
  description: "Trung tâm căn cứ — thường là mục tiêu chính cần bảo vệ hoặc phá huỷ.",
  color: "#d4a94e",
  footprintWidth: 3,
  footprintHeight: 3,
  fields: [
    {
      key: "side",
      label: "Phe",
      kind: "select",
      default: "player",
      options: [
        { value: "player", label: "Người chơi" },
        { value: "enemy", label: "Địch" },
        { value: "neutral", label: "Trung lập" },
      ],
    },
    { key: "hp", label: "Máu (HP)", kind: "number", default: 500, min: 1 },
  ],
};
