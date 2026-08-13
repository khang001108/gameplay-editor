import type { MapObjectDefinition } from "../../types/mapDefs";

export const pawnDef: MapObjectDefinition = {
  type: "pawn",
  kind: "unit",
  label: "Lính thường",
  description: "Đặt sẵn 1 lính thường lên map lúc bắt đầu màn chơi.",
  color: "#8a8a8a",
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
