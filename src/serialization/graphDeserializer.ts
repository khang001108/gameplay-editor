import type { Node, Edge } from "@xyflow/react";
import type { GraphDocument, GraphNodeData } from "../types/graph";
import { getNodeDefinition } from "../nodeDefinitions";

export interface DeserializeResult {
  name: string;
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
  warnings: string[];
}

/** Kiểm tra thô 1 object có đúng hình dạng GraphDocument không trước khi tin dùng */
export function isGraphDocument(value: unknown): value is GraphDocument {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && Array.isArray(v.nodes) && Array.isArray(v.edges) && typeof v.name === "string";
}

export function deserializeGraph(doc: GraphDocument): DeserializeResult {
  const warnings: string[] = [];
  const validNodeIds = new Set<string>();

  const nodes: Node<GraphNodeData>[] = doc.nodes.flatMap((n) => {
    const def = getNodeDefinition(n.data.defType);
    if (!def) {
      warnings.push(`Bỏ qua node "${n.id}" — không rõ loại "${n.data.defType}" (có thể do phiên bản cũ).`);
      return [];
    }
    validNodeIds.add(n.id);
    return [
      {
        id: n.id,
        type: n.data.category,
        position: n.position,
        data: n.data,
      },
    ];
  });

  const edges: Edge[] = doc.edges.flatMap((e) => {
    if (!validNodeIds.has(e.source) || !validNodeIds.has(e.target)) {
      warnings.push(`Bỏ qua dây nối "${e.id}" — node đầu/cuối không tồn tại.`);
      return [];
    }
    return [
      {
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
      },
    ];
  });

  return { name: doc.name, nodes, edges, warnings };
}
