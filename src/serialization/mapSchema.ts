import type { MapDocument } from "../types/map";

export const MAP_SCHEMA_VERSION = 1 as const;

export const DEFAULT_MAP_WIDTH = 20;
export const DEFAULT_MAP_HEIGHT = 15;
export const DEFAULT_TILE_SIZE = 32;

export function emptyMapDocument(name = "Untitled Map"): MapDocument {
  return {
    version: MAP_SCHEMA_VERSION,
    name,
    width: DEFAULT_MAP_WIDTH,
    height: DEFAULT_MAP_HEIGHT,
    tileSize: DEFAULT_TILE_SIZE,
    tilesets: [],
    terrain: new Array(DEFAULT_MAP_WIDTH * DEFAULT_MAP_HEIGHT).fill(null),
    objects: [],
    areas: [],
  };
}
