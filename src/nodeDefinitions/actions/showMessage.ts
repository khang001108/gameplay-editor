import type { NodeDefinition } from "../../types/nodeDefs";

export const showMessageNode: NodeDefinition = {
  type: "show_message",
  category: "action",
  label: "Show Message",
  description: "Hiện thông báo dạng chữ trên màn hình người chơi trong khoảng thời gian chỉ định.",
  color: "#6b9c5f",
  inputs: ["in"],
  outputs: ["out"],
  fields: [
    { key: "text", label: "Nội dung", kind: "text", default: "", placeholder: "Nhập thông báo..." },
    { key: "durationSeconds", label: "Hiện trong (giây)", kind: "number", default: 4, min: 1 },
  ],
};
