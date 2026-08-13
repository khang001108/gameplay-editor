import type { NodeDefinition } from "../../types/nodeDefs";

export const buildingDestroyedNode: NodeDefinition = {
  type: "building_destroyed",
  category: "event",
  label: "Building Destroyed",
  description: "Kích hoạt khi 1 công trình (thuộc loại/phe chỉ định) bị phá huỷ.",
  color: "#5b8dbe",
  inputs: [],
  outputs: ["out"],
  fields: [
    {
      key: "buildingType",
      label: "Loại công trình",
      kind: "select",
      default: "any",
      options: [
        { value: "any", label: "Bất kỳ" },
        { value: "castle", label: "Lâu đài" },
        { value: "tower", label: "Tháp canh" },
        { value: "barracks", label: "Doanh trại" },
        { value: "house", label: "Nhà dân" },
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
