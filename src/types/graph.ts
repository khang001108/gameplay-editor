export type NodeCategory = "event" | "condition" | "action";

/** Giá trị property thực tế lưu trên 1 node (khớp với field do NodeDefinition khai báo) */
export type FieldValue = string | number | boolean;

export interface GraphNodeData extends Record<string, unknown> {
  /** type trong NodeDefinition, vd "spawn_unit" — dùng để tra lại định nghĩa/label/màu/field */
  defType: string;
  category: NodeCategory;
  values: Record<string, FieldValue>;
}

export interface GraphNode {
  id: string;
  position: { x: number; y: number };
  data: GraphNodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface GraphDocument {
  version: 1;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
