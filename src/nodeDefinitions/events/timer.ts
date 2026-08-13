import type { NodeDefinition } from "../../types/nodeDefs";

export const timerNode: NodeDefinition = {
  type: "timer",
  category: "event",
  label: "Timer",
  description: "Kích hoạt sau khoảng thời gian chỉ định, có thể lặp lại.",
  color: "#5b8dbe",
  inputs: [],
  outputs: ["out"],
  fields: [
    { key: "seconds", label: "Số giây", kind: "number", default: 10, min: 0 },
    { key: "repeat", label: "Lặp lại", kind: "boolean", default: false },
  ],
};
