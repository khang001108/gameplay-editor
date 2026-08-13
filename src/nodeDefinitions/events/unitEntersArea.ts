import type { NodeDefinition } from "../../types/nodeDefs";

export const unitEntersAreaNode: NodeDefinition = {
  type: "unit_enters_area",
  category: "event",
  label: "Unit Enters Area",
  description: "Kích hoạt khi 1 unit bước vào vùng hình tròn đã đánh dấu trên map.",
  color: "#5b8dbe",
  inputs: [],
  outputs: ["out"],
  fields: [
    {
      key: "areaId",
      label: "ID vùng",
      kind: "text",
      default: "area_1",
      helpText: "Trùng khớp với ID vùng đã đặt trong map editor (Tiled object).",
    },
    {
      key: "side",
      label: "Phe kích hoạt",
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
