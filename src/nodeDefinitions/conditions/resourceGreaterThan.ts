import type { NodeDefinition } from "../../types/nodeDefs";

export const resourceGreaterThanNode: NodeDefinition = {
  type: "resource_greater_than",
  category: "condition",
  label: "Resource Greater Than",
  description: "Đúng nếu lượng tài nguyên của phe chỉ định lớn hơn ngưỡng.",
  color: "#d4a94e",
  inputs: ["in"],
  outputs: ["true", "false"],
  fields: [
    {
      key: "resource",
      label: "Loại tài nguyên",
      kind: "select",
      default: "gold",
      options: [
        { value: "gold", label: "Vàng" },
        { value: "wood", label: "Gỗ" },
        { value: "meat", label: "Thịt" },
      ],
    },
    { key: "amount", label: "Ngưỡng", kind: "number", default: 100, min: 0 },
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
