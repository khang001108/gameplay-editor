import { useEffect, useRef, useState } from "react";
import type { TilesetDef } from "../../types/map";

/** Cache 1 HTMLImageElement/tileset, dùng chung cho bảng chọn tile và canvas vẽ terrain —
 * tránh load lại ảnh 2 lần và đảm bảo cả 2 nơi hiển thị đúng cùng 1 ảnh đã load xong. */
export function useTilesetImages(tilesets: TilesetDef[]): Map<string, HTMLImageElement> {
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, setTick] = useState(0);

  useEffect(() => {
    for (const ts of tilesets) {
      if (cacheRef.current.has(ts.id)) continue;
      const img = new Image();
      // ảnh có thể là URL Supabase Storage (sau khi lưu Cloud) thay vì data: URL cục bộ — cần
      // crossOrigin để canvas không bị "tainted" nếu sau này có tính năng đọc lại pixel/export.
      img.crossOrigin = "anonymous";
      img.onload = () => setTick((t) => t + 1);
      img.src = ts.imageDataUrl;
      cacheRef.current.set(ts.id, img);
    }
    for (const id of Array.from(cacheRef.current.keys())) {
      if (!tilesets.some((t) => t.id === id)) cacheRef.current.delete(id);
    }
  }, [tilesets]);

  return cacheRef.current;
}
