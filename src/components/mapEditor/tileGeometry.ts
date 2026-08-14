import type { TilesetDef } from "../../types/map";

/** Toạ độ pixel (trên ảnh gốc) của 1 tile theo index — có tính margin/spacing kiểu Tiled,
 * dùng chung cho cả bảng chọn tile (TileThumbnail) và canvas vẽ terrain để luôn khớp pixel-for-pixel. */
export function tileSourceRect(ts: TilesetDef, tileIndex: number) {
  const col = tileIndex % ts.columns;
  const row = Math.floor(tileIndex / ts.columns);
  return {
    sx: ts.marginX + col * (ts.tileWidth + ts.spacingX),
    sy: ts.marginY + row * (ts.tileHeight + ts.spacingY),
    sw: ts.tileWidth,
    sh: ts.tileHeight,
  };
}

/** Nếu tileIndex có animation gắn sẵn (xem TilesetDef.animations), trả về tileIndex của frame
 * đang hiện tại thời điểm nowMs — giống cách Tiled phát Tile Animation. Không animate thì trả nguyên. */
export function resolveAnimatedTileIndex(ts: TilesetDef, tileIndex: number, nowMs: number): number {
  const frames = ts.animations[tileIndex];
  if (!frames || frames.length === 0) return tileIndex;
  const total = frames.reduce((sum, f) => sum + f.duration, 0);
  if (total <= 0) return tileIndex;
  let t = nowMs % total;
  for (const frame of frames) {
    if (t < frame.duration) return frame.tileIndex;
    t -= frame.duration;
  }
  return frames[frames.length - 1].tileIndex;
}
