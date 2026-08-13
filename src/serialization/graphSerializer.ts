import type { Node, Edge } from "@xyflow/react";
import type { GraphDocument, GraphNodeData } from "../types/graph";
import { GRAPH_SCHEMA_VERSION } from "./schema";

export function serializeGraph(
  name: string,
  nodes: Node<GraphNodeData>[],
  edges: Edge[]
): GraphDocument {
  return {
    version: GRAPH_SCHEMA_VERSION,
    name,
    nodes: nodes.map((n) => ({
      id: n.id,
      position: { x: n.position.x, y: n.position.y },
      data: n.data,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? "out",
      target: e.target,
      targetHandle: e.targetHandle ?? "in",
    })),
  };
}
