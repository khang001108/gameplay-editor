import type { NodeProps, Node } from "@xyflow/react";
import type { GraphNodeData } from "../../../types/graph";
import { getNodeDefinition } from "../../../nodeDefinitions";
import { NodeCard } from "./NodeCard";

export function EventNode({ data, selected }: NodeProps<Node<GraphNodeData>>) {
  const def = getNodeDefinition(data.defType);
  if (!def) return null;
  return <NodeCard def={def} data={data} selected={!!selected} />;
}
