import type { MapObjectDefinition } from "../../types/mapDefs";

export const towerDef: MapObjectDefinition = {
  type: "tower",
  kind: "building",
  label: "Tháp canh",
  description: "Công trình phòng thủ, tự động tấn công địch lại gần.",
  color: "#b5533f",
  footprintWidth: 1,
  footprintHeight: 2,
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
    { key: "hp", label: "Máu (HP)", kind: "number", default: 200, min: 1 },
    { key: "range", label: "Tầm bắn (ô)", kind: "number", default: 4, min: 1 },
  ],
};
