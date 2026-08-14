import { useEffect, useRef } from "react";
import type { TilesetDef } from "../../../types/map";
import { tileSourceRect } from "../tileGeometry";

/** Vẽ đúng 1 tile bằng <canvas> crop trực tiếp từ ảnh gốc — không dùng CSS background-size,
 * vì background-size ép ảnh co giãn theo kích thước tính toán nên hay bị lệch/nhoè khi ảnh
 * không chia hết cho tileWidth/tileHeight (đây là nguyên nhân bảng chọn tile từng bị "lung tung"). */
export function TileThumbnail({
  img,
  ts,
  tileIndex,
  size,
}: {
  img: HTMLImageElement | undefined;
  ts: TilesetDef;
  tileIndex: number;
  size: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    const { sx, sy, sw, sh } = tileSourceRect(ts, tileIndex);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
  }, [img, img?.complete, ts, tileIndex, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="tile-swatch__canvas" />;
}
