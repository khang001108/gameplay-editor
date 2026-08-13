import type { MapArea, MapDocument, MapObject, TerrainCellRef, TilesetDef } from "../types/map";
import { getMapObjectDefinition } from "../mapDefinitions";

export interface MapDeserializeResult {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tilesets: TilesetDef[];
  terrain: (TerrainCellRef | null)[];
  objects: MapObject[];
  areas: MapArea[];
  warnings: string[];
}

/** Kiểm tra thô 1 object có đúng hình dạng MapDocument không trước khi tin dùng */
export function isMapDocument(value: unknown): value is MapDocument {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    typeof v.name === "string" &&
    typeof v.width === "number" &&
    typeof v.height === "number" &&
    typeof v.tileSize === "number" &&
    Array.isArray(v.tilesets) &&
    Array.isArray(v.terrain) &&
    Array.isArray(v.objects) &&
    Array.isArray(v.areas)
  );
}

export function deserializeMap(doc: MapDocument): MapDeserializeResult {
  const warnings: string[] = [];
  const tilesetIds = new Set(doc.tilesets.map((t) => t.id));

  const expectedLen = doc.width * doc.height;
  let terrain = doc.terrain;
  if (terrain.length !== expectedLen) {
    warnings.push("Kích thước terrain trong file không khớp width×height — đã reset terrain về trống.");
    terrain = new Array(expectedLen).fill(null);
  } else {
    terrain = terrain.map((cell) => {
      if (!cell) return null;
      if (!tilesetIds.has(cell.tilesetId)) return null;
      return cell;
    });
  }

  const objects = doc.objects.flatMap((o) => {
    const def = getMapObjectDefinition(o.defType);
    if (!def) {
      warnings.push(`Bỏ qua object "${o.id}" — không rõ loại "${o.defType}" (có thể do phiên bản cũ).`);
      return [];
    }
    return [o];
  });

  return {
    name: doc.name,
    width: doc.width,
    height: doc.height,
    tileSize: doc.tileSize,
    tilesets: doc.tilesets,
    terrain,
    objects,
    areas: doc.areas,
    warnings,
  };
}
