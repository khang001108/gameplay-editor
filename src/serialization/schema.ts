import type { GraphDocument } from "../types/graph";

export const GRAPH_SCHEMA_VERSION = 1 as const;

export function emptyDocument(name = "Untitled Gameplay Graph"): GraphDocument {
  return { version: GRAPH_SCHEMA_VERSION, name, nodes: [], edges: [] };
}
