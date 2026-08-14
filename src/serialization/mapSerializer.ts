import type { MapArea, MapDocument, MapObject, TerrainLayer, TilesetDef } from "../types/map";
import { MAP_SCHEMA_VERSION } from "./mapSchema";

export function serializeMap(params: {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tilesets: TilesetDef[];
  layers: TerrainLayer[];
  objects: MapObject[];
  areas: MapArea[];
}): MapDocument {
  return { version: MAP_SCHEMA_VERSION, ...params };
}
