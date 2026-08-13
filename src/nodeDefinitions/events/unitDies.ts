import type { NodeDefinition } from "../../types/nodeDefs";

export const unitDiesNode: NodeDefinition = {
  type: "unit_dies",
  category: "event",
  label: "Unit Dies",
  description: "Kích hoạt khi 1 unit (thuộc loại/phe chỉ định) bị tiêu diệt.",
  color: "#5b8dbe",
  inputs: [],
  outputs: ["out"],
  fields: [
    {
      key: "unitType",
      label: "Loại quân",
      kind: "select",
      default: "any",
      options: [
        { value: "any", label: "Bất kỳ" },
        { value: "pawn", label: "Lính thường" },
        { value: "warrior", label: "Chiến binh" },
        { value: "archer", label: "Cung thủ" },
        { value: "monk", label: "Thầy tu" },
      ],
    },
    {
      key: "side",
      label: "Phe",
      kind: "select",
      default: "any",
      options: [
        { value: "any", label: "Bất kỳ" },
        { value: "player", label: "Người chơi" },
        { value: "enemy", label: "Địch" },
      ],
    },
  ],
};
