import type { NodeDefinition } from "../../types/nodeDefs";

export const defeatNode: NodeDefinition = {
  type: "defeat",
  category: "action",
  label: "Defeat",
  description: "Kết thúc trận đấu với kết quả THẤT BẠI cho phe chỉ định.",
  color: "#b5533f",
  inputs: ["in"],
  outputs: [],
  fields: [
    {
      key: "side",
      label: "Phe thua",
      kind: "select",
      default: "player",
      options: [
        { value: "player", label: "Người chơi" },
        { value: "enemy", label: "Địch" },
      ],
    },
  ],
};
