import type { FieldValue } from "./graph";
import type { MapObjectKind } from "./mapDefs";

/** 1 bộ ảnh tileset do người dùng import — ảnh được lưu thẳng dạng dataURL trong document
 * để file JSON xuất ra tự chứa đủ, mở lại ở máy khác không cần kèm file ảnh riêng. */
export interface TilesetDef {
  id: string;
  name: string;
  imageDataUrl: string;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
}

export interface TerrainCellRef {
  tilesetId: string;
  tileIndex: number;
}

export interface MapObject {
  id: string;
  kind: MapObjectKind;
  /** khớp với MapObjectDefinition.type trong src/mapDefinitions/ */
  defType: string;
  /** toạ độ ô (góc trên-trái) trên lưới, không phải pixel */
  x: number;
  y: number;
  values: Record<string, FieldValue>;
}

export type AreaKind = "spawn" | "trigger" | "boundary";
export type AreaTeam = "" | "player" | "enemy" | "neutral";

export interface MapArea {
  id: string;
  kind: AreaKind;
  name: string;
  team: AreaTeam;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapDocument {
  version: 1;
  name: string;
  /** kích thước lưới, tính theo số ô */
  width: number;
  height: number;
  /** kích thước 1 ô khi hiển thị, tính theo px */
  tileSize: number;
  tilesets: TilesetDef[];
  /** mảng phẳng row-major, độ dài = width * height */
  terrain: (TerrainCellRef | null)[];
  objects: MapObject[];
  areas: MapArea[];
}
