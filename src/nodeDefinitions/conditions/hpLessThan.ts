import type { NodeDefinition } from "../../types/nodeDefs";

export const hpLessThanNode: NodeDefinition = {
  type: "hp_less_than",
  category: "condition",
  label: "HP Less Than",
  description: "Đúng nếu HP hiện tại của đối tượng liên quan thấp hơn ngưỡng (theo %).",
  color: "#d4a94e",
  inputs: ["in"],
  outputs: ["true", "false"],
  fields: [{ key: "percent", label: "Ngưỡng HP (%)", kind: "number", default: 30, min: 0, max: 100 }],
};
