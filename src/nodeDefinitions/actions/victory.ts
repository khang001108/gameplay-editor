import type { NodeDefinition } from "../../types/nodeDefs";

export const victoryNode: NodeDefinition = {
  type: "victory",
  category: "action",
  label: "Victory",
  description: "Kết thúc trận đấu với kết quả CHIẾN THẮNG cho phe chỉ định.",
  color: "#6b9c5f",
  inputs: ["in"],
  outputs: [],
  fields: [
    {
      key: "side",
      label: "Phe thắng",
      kind: "select",
      default: "player",
      options: [
        { value: "player", label: "Người chơi" },
        { value: "enemy", label: "Địch" },
      ],
    },
  ],
};
