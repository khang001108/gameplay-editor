import type { MapObjectDefinition } from "../../types/mapDefs";

export const archerDef: MapObjectDefinition = {
  type: "archer",
  kind: "unit",
  label: "Cung thủ",
  description: "Đặt sẵn 1 cung thủ lên map lúc bắt đầu màn chơi.",
  color: "#5b8dbe",
  footprintWidth: 1,
  footprintHeight: 1,
  fields: [
    {
      key: "side",
      label: "Phe",
      kind: "select",
      default: "player",
      options: [
        { value: "player", label: "Người chơi" },
        { value: "enemy", label: "Địch" },
      ],
    },
  ],
};
