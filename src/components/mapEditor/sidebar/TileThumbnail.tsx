import type { CSSProperties } from "react";
import type { TilesetDef } from "../../../types/map";
import { tileSourceRect } from "../tileGeometry";

/** Vẽ đúng 1 tile bằng CSS background-position crop từ ảnh gốc (KHÔNG dùng <canvas>+drawImage nữa —
 * mỗi canvas cần 1 context + 1 draw call + 1 effect riêng, mở 1 folder cả nghìn tile là cả nghìn
 * canvas dựng cùng lúc, chính là nguyên nhân đơ trang). background-size/position tính bằng PIXEL
 * tuyệt đối (không phải %, không phải "cover") nên không bị lệch/nhoè dù ảnh không chia hết cho
 * tileWidth/tileHeight — cùng công thức toạ độ với canvas cũ (tileSourceRect), chỉ đổi cách vẽ. */
export function TileThumbnail({
  img,
  ts,
  tileIndex,
  size,
  loading,
}: {
  img: HTMLImageElement | undefined;
  ts: TilesetDef;
  tileIndex: number;
  size: number;
  /** true khi ảnh gốc của tileset này đang tải (folder vừa mở ra) — hiện skeleton thay vì ô trống trơn */
  loading?: boolean;
}) {
  const ready = img && img.complete && img.naturalWidth > 0;

  let style: CSSProperties = { width: size, height: size };
  if (ready) {
    const { sx, sy, sw, sh } = tileSourceRect(ts, tileIndex);
    const scaleX = size / sw;
    const scaleY = size / sh;
    style = {
      ...style,
      backgroundImage: `url(${img.src})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${img.naturalWidth * scaleX}px ${img.naturalHeight * scaleY}px`,
      backgroundPosition: `-${sx * scaleX}px -${sy * scaleY}px`,
    };
  }

  return <div className={`tile-swatch__canvas${loading ? " tile-swatch__canvas--loading" : ""}`} style={style} />;
}
