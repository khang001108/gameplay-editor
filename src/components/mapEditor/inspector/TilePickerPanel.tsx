import { useEffect, useState } from "react";
import { useMapStore } from "../../../state/mapStore";
import { useUiStore } from "../../../state/uiStore";
import { useTilesetImages } from "../useTilesetImages";
import { TileThumbnail } from "../sidebar/TileThumbnail";
import { AnimationEditorPopup } from "../sidebar/AnimationEditorPopup";
import type { TileAnimationFrame } from "../../../types/map";

const SWATCH_SIZE = 28;

interface DragCell {
  col: number;
  row: number;
}

function sameTiles(a: number[] | undefined, b: number[]): boolean {
  if (!a || a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/** Thay chỗ Inspector ở panel phải trong lúc tool đang là "Vẽ terrain" (xem MapEditorShell.tsx) —
 * hiện bảng chọn từng ô của ĐÚNG tileset đang dùng (activeStamp.tilesetId), thay vì phải cuộn tìm
 * trong sidebar trái như trước. Đổi sang tileset khác thì mở lại popup "Quản lý Tileset". */
export function TilePickerPanel() {
  const tilesets = useMapStore((s) => s.tilesets);
  const activeStamp = useMapStore((s) => s.activeStamp);
  const setActiveStamp = useMapStore((s) => s.setActiveStamp);
  const setTileAnimationFrames = useMapStore((s) => s.setTileAnimationFrames);
  const setTileAnimationFramesForMany = useMapStore((s) => s.setTileAnimationFramesForMany);
  const toggleTilesetGallery = useUiStore((s) => s.toggleTilesetGallery);

  const { images, isLoading } = useTilesetImages(tilesets);

  const ts = tilesets.find((t) => t.id === activeStamp?.tilesetId);

  // kéo chuột trên bảng tile để chọn 1 vùng nhiều ô (giống Tiled) — dùng chung cho cả chọn stamp
  // để vẽ VÀ chọn nhiều ô liền lúc thêm animation frame (xem dragPurpose)
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragCell | null>(null);
  const [dragCur, setDragCur] = useState<DragCell | null>(null);
  const [dragPurpose, setDragPurpose] = useState<"stamp" | "frames">("stamp");

  // sửa animation cho 1 block (1 ô hoặc nhiều ô — chính là activeStamp lúc bấm "🎞 Animation"):
  // bấm "+ Thêm frame" rồi kéo bôi đen trong bảng để nối thêm frame. Block 1 ô: mọi ô kéo qua là
  // 1 frame riêng nối tuần tự. Block nhiều ô: phải kéo đúng kích thước, khớp theo vị trí (1↔1, 2↔2...).
  const [editingAnim, setEditingAnim] = useState<{ baseTiles: number[]; width: number; height: number } | null>(null);
  const [pickingFrame, setPickingFrame] = useState(false);

  useEffect(() => {
    if (!dragging || !ts) return;
    const handleUp = () => {
      if (dragStart && dragCur) {
        const minCol = Math.min(dragStart.col, dragCur.col);
        const minRow = Math.min(dragStart.row, dragCur.row);
        const w = Math.abs(dragCur.col - dragStart.col) + 1;
        const h = Math.abs(dragCur.row - dragStart.row) + 1;

        if (dragPurpose === "frames" && editingAnim) {
          const isSingleTile = editingAnim.width === 1 && editingAnim.height === 1;
          if (isSingleTile) {
            // block 1 ô: giữ hành vi cũ — mọi ô kéo qua đều là 1 frame riêng, nối tuần tự vào tile gốc
            const baseTileIndex = editingAnim.baseTiles[0];
            const currentFrames = ts.animations[baseTileIndex] ?? [];
            const newFrames: TileAnimationFrame[] = [];
            for (let dy = 0; dy < h; dy++) {
              for (let dx = 0; dx < w; dx++) {
                newFrames.push({ tileIndex: (minRow + dy) * ts.columns + (minCol + dx), duration: 200 });
              }
            }
            setTileAnimationFrames(ts.id, baseTileIndex, [...currentFrames, ...newFrames]);
            setPickingFrame(false);
          } else if (w === editingAnim.width && h === editingAnim.height) {
            // block nhiều ô: vùng kéo phải khớp đúng kích thước gốc, ghép frame theo đúng vị trí (1↔1, 2↔2...)
            const entries = editingAnim.baseTiles.map((baseTileIndex, i) => {
              const dx = i % editingAnim.width;
              const dy = Math.floor(i / editingAnim.width);
              const frameTileIndex = (minRow + dy) * ts.columns + (minCol + dx);
              const currentFrames = ts.animations[baseTileIndex] ?? [];
              return { baseTileIndex, frames: [...currentFrames, { tileIndex: frameTileIndex, duration: 200 }] };
            });
            setTileAnimationFramesForMany(ts.id, entries);
            setPickingFrame(false);
          } else {
            window.alert(
              `Vùng chọn phải đúng ${editingAnim.width}×${editingAnim.height} ô (bằng kích thước block gốc) để khớp đúng vị trí từng ô — bạn vừa kéo ${w}×${h}.`
            );
          }
        } else {
          const tiles: number[] = [];
          for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
              tiles.push((minRow + dy) * ts.columns + (minCol + dx));
            }
          }
          setActiveStamp({ tilesetId: ts.id, width: w, height: h, tiles });
        }
      }
      setDragging(false);
      setDragStart(null);
      setDragCur(null);
    };
    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, [dragging, dragStart, dragCur, dragPurpose, editingAnim, ts, setActiveStamp, setTileAnimationFrames, setTileAnimationFramesForMany]);

  // theo dõi ngón tay/chuột đang di chuyển qua ô nào trong bảng — dùng elementFromPoint thay vì
  // onMouseEnter từng ô, vì trên cảm ứng mọi pointermove vẫn nhắm vào ô đã chạm đầu tiên (auto-capture).
  useEffect(() => {
    if (!dragging || !ts) return;
    const handleMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const swatch = el?.closest<HTMLElement>("[data-tile-index]");
      if (!swatch) return;
      const idx = Number(swatch.dataset.tileIndex);
      setDragCur({ col: idx % ts.columns, row: Math.floor(idx / ts.columns) });
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [dragging, ts]);

  if (!ts) {
    return (
      <aside className="inspector">
        <div className="inspector__empty">Chưa chọn tileset nào để vẽ.</div>
        <button className="btn btn--sm" onClick={toggleTilesetGallery}>
          🗂 Quản lý Tileset
        </button>
      </aside>
    );
  }

  const img = images.get(ts.id);
  const loading = isLoading(ts.id);

  const isHighlighted = (col: number, row: number) => {
    if (dragging && dragStart && dragCur) {
      const minC = Math.min(dragStart.col, dragCur.col);
      const maxC = Math.max(dragStart.col, dragCur.col);
      const minR = Math.min(dragStart.row, dragCur.row);
      const maxR = Math.max(dragStart.row, dragCur.row);
      return col >= minC && col <= maxC && row >= minR && row <= maxR;
    }
    if (activeStamp && activeStamp.tilesetId === ts.id) {
      const originCol = activeStamp.tiles[0] % ts.columns;
      const originRow = Math.floor(activeStamp.tiles[0] / ts.columns);
      return col >= originCol && col < originCol + activeStamp.width && row >= originRow && row < originRow + activeStamp.height;
    }
    return false;
  };

  return (
    <aside className="inspector tile-picker">
      <div className="tile-picker__header">
        <span>
          {ts.name} <em>({ts.columns}×{ts.rows})</em>
          {loading && (
            <>
              {" "}
              <span className="tileset-block__loading" title="Đang tải ảnh…">
                ⏳
              </span>
            </>
          )}
        </span>
        <button className="btn btn--sm" onClick={toggleTilesetGallery}>
          🗂 Đổi tileset
        </button>
      </div>

      <div className="tile-palette" style={{ gridTemplateColumns: `repeat(${ts.columns}, ${SWATCH_SIZE}px)` }}>
        {Array.from({ length: ts.columns * ts.rows }).map((_, i) => {
          const col = i % ts.columns;
          const row = Math.floor(i / ts.columns);
          const highlighted = isHighlighted(col, row);
          const hasAnimation = Boolean(ts.animations[i]?.length);
          return (
            <button
              key={i}
              type="button"
              className={`tile-swatch${highlighted ? " tile-swatch--active" : ""}`}
              style={{ width: SWATCH_SIZE, height: SWATCH_SIZE }}
              title={hasAnimation ? `Tile #${i} — có animation` : `Tile #${i}`}
              data-tile-index={i}
              onPointerDown={(e) => {
                e.preventDefault();
                setDragPurpose(pickingFrame && editingAnim ? "frames" : "stamp");
                setDragging(true);
                setDragStart({ col, row });
                setDragCur({ col, row });
              }}
            >
              <TileThumbnail img={img} ts={ts} tileIndex={i} size={SWATCH_SIZE} loading={loading} />
              {hasAnimation && <span className="tile-swatch__anim-badge">▶</span>}
            </button>
          );
        })}
      </div>

      {activeStamp && activeStamp.tilesetId === ts.id && (
        <div className="map-toolrow">
          <button
            className={`btn btn--sm${editingAnim && sameTiles(editingAnim.baseTiles, activeStamp.tiles) ? " btn--primary" : ""}`}
            onClick={() => {
              const isSame = editingAnim && sameTiles(editingAnim.baseTiles, activeStamp.tiles);
              if (isSame) {
                setEditingAnim(null);
                setPickingFrame(false);
              } else {
                setEditingAnim({ baseTiles: activeStamp.tiles, width: activeStamp.width, height: activeStamp.height });
                setPickingFrame(false);
              }
            }}
          >
            🎞 Animation cho block {activeStamp.width}×{activeStamp.height}
          </button>
        </div>
      )}

      {editingAnim && (
        <AnimationEditorPopup
          tileset={ts}
          img={img}
          baseTiles={editingAnim.baseTiles}
          width={editingAnim.width}
          height={editingAnim.height}
          pickingFrame={pickingFrame}
          onTogglePicking={() => setPickingFrame((v) => !v)}
          onClose={() => {
            setEditingAnim(null);
            setPickingFrame(false);
          }}
        />
      )}
    </aside>
  );
}
