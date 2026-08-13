import type { NodeDefinition } from "../../types/nodeDefs";

export const attackTargetNode: NodeDefinition = {
  type: "attack_target",
  category: "action",
  label: "Attack Target",
  description: "Ra lệnh cho unit tấn công 1 mục tiêu chỉ định.",
  color: "#6b9c5f",
  inputs: ["in"],
  outputs: ["out"],
  fields: [
    { key: "unitId", label: "ID unit tấn công", kind: "text", default: "", helpText: "Để trống = unit vừa kích hoạt Event." },
    { key: "targetId", label: "ID mục tiêu", kind: "text", default: "", placeholder: "vd enemy_tower" },
  ],
};
