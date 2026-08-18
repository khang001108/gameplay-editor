import type { FieldValue } from "./graph";
import type { MapObjectKind } from "./mapDefs";

export interface TileAnimationFrame {
  /** tileIndex trong cùng tileset sẽ hiện tại frame này */
  tileIndex: number;
  /** thời lượng hiện frame, tính bằng mili-giây */
  duration: number;
}

/** 1 bộ ảnh tileset do người dùng import — lúc mới import/đang sửa cục bộ, `imageDataUrl` là data: URL
 * (base64) để "Export" ra JSON tự chứa đủ, mở lại ở máy khác không cần kèm file ảnh riêng. Sau khi
 * "Lưu Cloud", ảnh được upload lên Supabase Storage và field này đổi thành URL public trỏ tới đó
 * (tránh nhét base64 nặng vào cột jsonb) — xem resolveMapImagesForCloud() trong lib/cloudApi.ts. */
export interface TilesetDef {
  id: string;
  name: string;
  imageDataUrl: string;
  tileWidth: number;
  tileHeight: number;
  /** khoảng trắng viền ngoài trước tile đầu tiên (px) — giống "Margin" trong Tiled */
  marginX: number;
  marginY: number;
  /** khoảng cách giữa 2 tile liền kề (px) — giống "Spacing" trong Tiled */
  spacingX: number;
  spacingY: number;
  columns: number;
  rows: number;
  /** animation gắn theo tileIndex "gốc" — hễ terrain nào đặt tile này sẽ tự động chạy qua các frame,
   * giống Tile Animation Editor trong Tiled. Key là tileIndex (number), rỗng = tile không animate. */
  animations: Record<number, TileAnimationFrame[]>;
}

export interface TerrainCellRef {
  tilesetId: string;
  tileIndex: number;
}

/** 1 layer terrain — vẽ chồng lên nhau theo thứ tự trong mảng `MapDocument.layers`
 * (phần tử đầu = dưới cùng, phần tử cuối = trên cùng), giống layer trong Tiled. */
export interface TerrainLayer {
  id: string;
  name: string;
  visible: boolean;
  /** mảng phẳng row-major, độ dài = width * height */
  cells: (TerrainCellRef | null)[];
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
  layers: TerrainLayer[];
  objects: MapObject[];
  areas: MapArea[];
}
