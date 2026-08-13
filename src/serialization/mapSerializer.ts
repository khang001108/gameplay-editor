import type { MapArea, MapDocument, MapObject, TerrainCellRef, TilesetDef } from "../types/map";
import { MAP_SCHEMA_VERSION } from "./mapSchema";

export function serializeMap(params: {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tilesets: TilesetDef[];
  terrain: (TerrainCellRef | null)[];
  objects: MapObject[];
  areas: MapArea[];
}): MapDocument {
  return { version: MAP_SCHEMA_VERSION, ...params };
}
