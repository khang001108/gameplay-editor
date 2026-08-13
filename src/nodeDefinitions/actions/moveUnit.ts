import type { NodeDefinition } from "../../types/nodeDefs";

export const moveUnitNode: NodeDefinition = {
  type: "move_unit",
  category: "action",
  label: "Move Unit",
  description: "Ra lệnh cho unit di chuyển tới 1 điểm/vùng trên map (đi theo A*, né chướng ngại).",
  color: "#6b9c5f",
  inputs: ["in"],
  outputs: ["out"],
  fields: [
    { key: "unitId", label: "ID unit", kind: "text", default: "", helpText: "Để trống = unit vừa kích hoạt Event." },
    { key: "targetPointId", label: "Điểm đến (ID)", kind: "text", default: "", placeholder: "vd rally_point_1" },
  ],
};
