import type { MapObjectDefinition } from "../../types/mapDefs";

export const warriorDef: MapObjectDefinition = {
  type: "warrior",
  kind: "unit",
  label: "Chiến binh",
  description: "Đặt sẵn 1 chiến binh lên map lúc bắt đầu màn chơi.",
  color: "#6b9c5f",
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
