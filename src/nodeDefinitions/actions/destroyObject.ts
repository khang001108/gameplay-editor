import type { NodeDefinition } from "../../types/nodeDefs";

export const destroyObjectNode: NodeDefinition = {
  type: "destroy_object",
  category: "action",
  label: "Destroy Object",
  description: "Xoá 1 unit hoặc công trình chỉ định khỏi trận đấu.",
  color: "#6b9c5f",
  inputs: ["in"],
  outputs: ["out"],
  fields: [
    {
      key: "targetId",
      label: "ID đối tượng",
      kind: "text",
      default: "",
      placeholder: "vd enemy_castle",
      helpText: "Để trống = đối tượng vừa kích hoạt Event (nếu có).",
    },
  ],
};
