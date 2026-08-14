import type { MapArea, MapDocument, MapObject, TerrainCellRef, TerrainLayer, TilesetDef } from "../types/map";
import { getMapObjectDefinition } from "../mapDefinitions";
import { makeId } from "../utils/id";

export interface MapDeserializeResult {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tilesets: TilesetDef[];
  layers: TerrainLayer[];
  objects: MapObject[];
  areas: MapArea[];
  warnings: string[];
}

/** Kiểm tra thô 1 object có đúng hình dạng MapDocument không trước khi tin dùng — chấp nhận cả
 * file cũ chỉ có 1 layer terrain phẳng (trường `terrain`) từ trước khi có tính năng nhiều layer. */
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
    (Array.isArray(v.layers) || Array.isArray(v.terrain)) &&
    Array.isArray(v.objects) &&
    Array.isArray(v.areas)
  );
}

export function deserializeMap(doc: MapDocument): MapDeserializeResult {
  const warnings: string[] = [];
  const tilesets: TilesetDef[] = doc.tilesets.map((t) => ({
    ...t,
    marginX: t.marginX ?? 0,
    marginY: t.marginY ?? 0,
    spacingX: t.spacingX ?? 0,
    spacingY: t.spacingY ?? 0,
    animations: t.animations ?? {},
  }));
  const tilesetIds = new Set(tilesets.map((t) => t.id));

  const expectedLen = doc.width * doc.height;

  const sanitizeCells = (cells: (TerrainCellRef | null)[]): (TerrainCellRef | null)[] => {
    if (cells.length !== expectedLen) {
      warnings.push("Kích thước 1 layer trong file không khớp width×height — đã reset layer đó về trống.");
      return new Array(expectedLen).fill(null);
    }
    return cells.map((cell) => (cell && tilesetIds.has(cell.tilesetId) ? cell : null));
  };

  // File cũ (trước khi có nhiều layer) chỉ có 1 mảng `terrain` phẳng — bọc lại thành 1 layer duy nhất.
  const rawLayers: TerrainLayer[] =
    doc.layers ??
    [{ id: makeId("layer"), name: "Layer 1", visible: true, cells: (doc as unknown as { terrain: (TerrainCellRef | null)[] }).terrain }];

  const layers: TerrainLayer[] = rawLayers.length > 0 ? rawLayers.map((l) => ({ ...l, cells: sanitizeCells(l.cells) })) : [
    { id: makeId("layer"), name: "Layer 1", visible: true, cells: new Array(expectedLen).fill(null) },
  ];

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
    tilesets,
    layers,
    objects,
    areas: doc.areas,
    warnings,
  };
}
