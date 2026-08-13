import type { NodeDefinition } from "../../types/nodeDefs";

export const giveResourceNode: NodeDefinition = {
  type: "give_resource",
  category: "action",
  label: "Give Resource",
  description: "Cộng thêm tài nguyên cho phe chỉ định.",
  color: "#6b9c5f",
  inputs: ["in"],
  outputs: ["out"],
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
    { key: "amount", label: "Số lượng", kind: "number", default: 50, min: 0 },
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
