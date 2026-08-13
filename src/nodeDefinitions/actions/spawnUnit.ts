import type { NodeDefinition } from "../../types/nodeDefs";

export const spawnUnitNode: NodeDefinition = {
  type: "spawn_unit",
  category: "action",
  label: "Spawn Unit",
  description: "Tạo ra 1 hoặc nhiều unit tại vị trí chỉ định.",
  color: "#6b9c5f",
  inputs: ["in"],
  outputs: ["out"],
  fields: [
    {
      key: "unitType",
      label: "Loại quân",
      kind: "select",
      default: "pawn",
      options: [
        { value: "pawn", label: "Lính thường" },
        { value: "warrior", label: "Chiến binh" },
        { value: "archer", label: "Cung thủ" },
        { value: "monk", label: "Thầy tu" },
      ],
    },
    { key: "count", label: "Số lượng", kind: "number", default: 1, min: 1 },
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
    {
      key: "spawnPointId",
      label: "Điểm spawn (ID)",
      kind: "text",
      default: "",
      placeholder: "vd base_west",
      helpText: "Để trống = spawn tại base mặc định của phe.",
    },
  ],
};
