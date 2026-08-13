import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
} from "@xyflow/react";
import type { GraphNodeData, FieldValue, GraphDocument } from "../types/graph";
import { getNodeDefinition } from "../nodeDefinitions";
import { makeId } from "../utils/id";
import { serializeGraph } from "../serialization/graphSerializer";
import { deserializeGraph, isGraphDocument } from "../serialization/graphDeserializer";
import { emptyDocument } from "../serialization/schema";

interface GraphState {
  graphName: string;
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  lastLoadWarnings: string[];

  onNodesChange: OnNodesChange<Node<GraphNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  addNodeFromPalette: (defType: string, position: { x: number; y: number }) => void;
  updateNodeField: (nodeId: string, fieldKey: string, value: FieldValue) => void;
  removeNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setGraphName: (name: string) => void;

  exportDocument: () => GraphDocument;
  loadDocument: (doc: unknown) => void;
  newGraph: () => void;
}

/** Chỉ cho phép nối 2 pin khớp loại — Condition true/false chỉ nối vào input "in" của node khác,
 * không cho nối lung tung (vd output nối ngược vào output). React Flow tự validate hướng handle
 * (source luôn ở output, target luôn ở input) nên ở đây chỉ cần chặn tự nối node vào chính nó. */
function isValidConnection(connection: Connection): boolean {
  return connection.source !== connection.target;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  graphName: "Untitled Gameplay Graph",
  nodes: [],
  edges: [],
  selectedNodeId: null,
  lastLoadWarnings: [],

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    if (!isValidConnection(connection)) return;
    set({ edges: addEdge({ ...connection, id: makeId("edge") }, get().edges) });
  },

  addNodeFromPalette: (defType, position) => {
    const def = getNodeDefinition(defType);
    if (!def) return;
    const values: Record<string, FieldValue> = {};
    for (const field of def.fields) values[field.key] = field.default;

    const node: Node<GraphNodeData> = {
      id: makeId(def.type),
      type: def.category,
      position,
      data: { defType: def.type, category: def.category, values },
    };
    set({ nodes: [...get().nodes, node], selectedNodeId: node.id });
  },

  updateNodeField: (nodeId, fieldKey, value) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, values: { ...n.data.values, [fieldKey]: value } } } : n
      ),
    });
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setGraphName: (name) => set({ graphName: name }),

  exportDocument: () => serializeGraph(get().graphName, get().nodes, get().edges),

  loadDocument: (doc) => {
    if (!isGraphDocument(doc)) {
      set({ lastLoadWarnings: ["File không đúng định dạng GraphDocument — đã huỷ load."] });
      return;
    }
    const result = deserializeGraph(doc);
    set({
      graphName: result.name,
      nodes: result.nodes,
      edges: result.edges,
      selectedNodeId: null,
      lastLoadWarnings: result.warnings,
    });
  },

  newGraph: () => {
    const doc = emptyDocument();
    set({ graphName: doc.name, nodes: [], edges: [], selectedNodeId: null, lastLoadWarnings: [] });
  },
}));
