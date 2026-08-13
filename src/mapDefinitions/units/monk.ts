import type { MapObjectDefinition } from "../../types/mapDefs";

export const monkDef: MapObjectDefinition = {
  type: "monk",
  kind: "unit",
  label: "Thầy tu",
  description: "Đặt sẵn 1 thầy tu lên map lúc bắt đầu màn chơi.",
  color: "#b58fd4",
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
