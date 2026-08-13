import type { MapObjectDefinition } from "../../types/mapDefs";

export const barracksDef: MapObjectDefinition = {
  type: "barracks",
  kind: "building",
  label: "Doanh trại",
  description: "Nơi huấn luyện quân lính.",
  color: "#6b9c5f",
  footprintWidth: 2,
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
    { key: "hp", label: "Máu (HP)", kind: "number", default: 300, min: 1 },
  ],
};
