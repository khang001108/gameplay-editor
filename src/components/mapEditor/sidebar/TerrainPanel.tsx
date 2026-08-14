import { useEffect, useRef, useState } from "react";
import { useMapStore } from "../../../state/mapStore";
import { useTilesetImages } from "../useTilesetImages";
import { TileThumbnail } from "./TileThumbnail";
import { LayersPanel } from "./LayersPanel";
import type { TileAnimationFrame } from "../../../types/map";

const SWATCH_SIZE = 28;

interface DragCell {
  col: number;
  row: number;
}

export function TerrainPanel() {
  const tilesets = useMapStore((s) => s.tilesets);
  const activeStamp = useMapStore((s) => s.activeStamp);
  const activeTool = useMapStore((s) => s.activeTool);
  const eraserSize = useMapStore((s) => s.eraserSize);
  const importTileset = useMapStore((s) => s.importTileset);
  const removeTileset = useMapStore((s) => s.removeTileset);
  const setActiveStamp = useMapStore((s) => s.setActiveStamp);
  const setActiveTool = useMapStore((s) => s.setActiveTool);
  const setEraserSize = useMapStore((s) => s.setEraserSize);
  const setTileAnimationFrames = useMapStore((s) => s.setTileAnimationFrames);
  const fillLayer = useMapStore((s) => s.fillLayer);

  const images = useTilesetImages(tilesets);

  const [tileW, setTileW] = useState(32);
  const [tileH, setTileH] = useState(32);
  const [marginX, setMarginX] = useState(0);
  const [marginY, setMarginY] = useState(0);
  const [spacingX, setSpacingX] = useState(0);
  const [spacingY, setSpacingY] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // kéo chuột trên bảng tile để chọn 1 vùng nhiều ô (giống Tiled) — dùng chung cho cả chọn stamp
  // để vẽ VÀ chọn nhiều ô liền lúc thêm animation frame (xem dragPurpose)
  const [dragTilesetId, setDragTilesetId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<DragCell | null>(null);
  const [dragCur, setDragCur] = useState<DragCell | null>(null);
  const [dragPurpose, setDragPurpose] = useState<"stamp" | "frames">("stamp");

  // sửa animation cho 1 tile "gốc": bấm "+ Thêm frame" rồi kéo bôi đen 1 hoặc nhiều ô trong bảng
  // để nối tất cả vào chuỗi cùng lúc (theo thứ tự trái→phải, trên→dưới)
  const [editingAnim, setEditingAnim] = useState<{ tilesetId: string; baseTileIndex: number } | null>(null);
  const [pickingFrame, setPickingFrame] = useState(false);

  const editingTileset = editingAnim ? tilesets.find((t) => t.id === editingAnim.tilesetId) : undefined;
  const editingFrames = editingAnim && editingTileset ? editingTileset.animations[editingAnim.baseTileIndex] ?? [] : [];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      await importTileset(file, Math.max(1, tileW), Math.max(1, tileH), Math.max(0, marginX), Math.max(0, marginY), Math.max(0, spacingX), Math.max(0, spacingY));
    } catch {
      window.alert("Không đọc được ảnh tileset — thử lại với file PNG/JPG khác.");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (!dragTilesetId) return;
    const handleUp = () => {
      const ts = tilesets.find((t) => t.id === dragTilesetId);
      if (ts && dragStart && dragCur) {
        const minCol = Math.min(dragStart.col, dragCur.col);
        const minRow = Math.min(dragStart.row, dragCur.row);
        const w = Math.abs(dragCur.col - dragStart.col) + 1;
        const h = Math.abs(dragCur.row - dragStart.row) + 1;

        if (dragPurpose === "frames" && editingAnim && editingAnim.tilesetId === ts.id) {
          const currentFrames = ts.animations[editingAnim.baseTileIndex] ?? [];
          const newFrames: TileAnimationFrame[] = [];
          for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
              newFrames.push({ tileIndex: (minRow + dy) * ts.columns + (minCol + dx), duration: 200 });
            }
          }
          setTileAnimationFrames(editingAnim.tilesetId, editingAnim.baseTileIndex, [...currentFrames, ...newFrames]);
          setPickingFrame(false);
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
      setDragTilesetId(null);
      setDragStart(null);
      setDragCur(null);
    };
    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, [dragTilesetId, dragStart, dragCur, dragPurpose, editingAnim, tilesets, setActiveStamp, setTileAnimationFrames]);

  // theo dõi ngón tay/chuột đang di chuyển qua ô nào trong bảng — dùng elementFromPoint thay vì
  // onMouseEnter từng ô, vì trên cảm ứng mọi pointermove vẫn nhắm vào ô đã chạm đầu tiên (auto-capture).
  useEffect(() => {
    if (!dragTilesetId) return;
    const handleMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const swatch = el?.closest<HTMLElement>("[data-tile-index]");
      if (!swatch || swatch.dataset.tilesetId !== dragTilesetId) return;
      const ts = tilesets.find((t) => t.id === dragTilesetId);
      if (!ts) return;
      const idx = Number(swatch.dataset.tileIndex);
      setDragCur({ col: idx % ts.columns, row: Math.floor(idx / ts.columns) });
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [dragTilesetId, tilesets]);

  const isHighlighted = (tsId: string, col: number, row: number) => {
    if (dragTilesetId === tsId && dragStart && dragCur) {
      const minC = Math.min(dragStart.col, dragCur.col);
      const maxC = Math.max(dragStart.col, dragCur.col);
      const minR = Math.min(dragStart.row, dragCur.row);
      const maxR = Math.max(dragStart.row, dragCur.row);
      return col >= minC && col <= maxC && row >= minR && row <= maxR;
    }
    if (activeStamp && activeStamp.tilesetId === tsId) {
      // suy ra vị trí góc trên-trái của stamp hiện tại từ tile đầu tiên trong danh sách
      const ts = tilesets.find((t) => t.id === tsId);
      if (!ts) return false;
      const originCol = activeStamp.tiles[0] % ts.columns;
      const originRow = Math.floor(activeStamp.tiles[0] / ts.columns);
      return col >= originCol && col < originCol + activeStamp.width && row >= originRow && row < originRow + activeStamp.height;
    }
    return false;
  };

  return (
    <div className="map-sidebar__section">
      <LayersPanel />

      <div className="map-sidebar__divider" />

      <div className="sidebar__hint">
        Import ảnh tileset (PNG), kéo chọn 1 hoặc nhiều ô trong bảng rồi vẽ lên canvas — giống Tiled.
      </div>

      <div className="tileset-import">
        <label>
          Tile W
          <input className="field-input field-input--sm" type="number" min={1} value={tileW} onChange={(e) => setTileW(Number(e.target.value) || 1)} />
        </label>
        <label>
          Tile H
          <input className="field-input field-input--sm" type="number" min={1} value={tileH} onChange={(e) => setTileH(Number(e.target.value) || 1)} />
        </label>
      </div>
      <div className="tileset-import">
        <label>
          Margin X
          <input className="field-input field-input--sm" type="number" min={0} value={marginX} onChange={(e) => setMarginX(Number(e.target.value) || 0)} />
        </label>
        <label>
          Margin Y
          <input className="field-input field-input--sm" type="number" min={0} value={marginY} onChange={(e) => setMarginY(Number(e.target.value) || 0)} />
        </label>
      </div>
      <div className="tileset-import">
        <label>
          Spacing X
          <input className="field-input field-input--sm" type="number" min={0} value={spacingX} onChange={(e) => setSpacingX(Number(e.target.value) || 0)} />
        </label>
        <label>
          Spacing Y
          <input className="field-input field-input--sm" type="number" min={0} value={spacingY} onChange={(e) => setSpacingY(Number(e.target.value) || 0)} />
        </label>
      </div>
      <p className="field-row__help">
        Margin = khoảng trắng viền ngoài ảnh trước ô đầu tiên. Spacing = khoảng cách giữa 2 ô. Để 0 nếu tileset không có viền/khoảng cách.
      </p>

      <button className="btn" disabled={importing} onClick={() => fileInputRef.current?.click()}>
        {importing ? "Đang tải…" : "+ Import ảnh tileset"}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />

      {tilesets.length === 0 && <p className="inspector__empty inspector__empty--inline">Chưa có tileset nào.</p>}

      {tilesets.map((ts) => {
        const img = images.get(ts.id);
        return (
          <div key={ts.id} className="tileset-block">
            <div className="tileset-block__header">
              <span>
                {ts.name} <em>({ts.columns}×{ts.rows})</em>
              </span>
              <button className="tileset-block__remove" title="Xoá tileset" onClick={() => removeTileset(ts.id)}>
                ✕
              </button>
            </div>
            <div
              className="tile-palette"
              style={{ gridTemplateColumns: `repeat(${ts.columns}, ${SWATCH_SIZE}px)` }}
            >
              {Array.from({ length: ts.columns * ts.rows }).map((_, i) => {
                const col = i % ts.columns;
                const row = Math.floor(i / ts.columns);
                const highlighted = isHighlighted(ts.id, col, row);
                const hasAnimation = Boolean(ts.animations[i]?.length);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`tile-swatch${highlighted ? " tile-swatch--active" : ""}`}
                    style={{ width: SWATCH_SIZE, height: SWATCH_SIZE }}
                    title={hasAnimation ? `Tile #${i} — có animation` : `Tile #${i}`}
                    data-tileset-id={ts.id}
                    data-tile-index={i}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setDragPurpose(pickingFrame && editingAnim && editingAnim.tilesetId === ts.id ? "frames" : "stamp");
                      setDragTilesetId(ts.id);
                      setDragStart({ col, row });
                      setDragCur({ col, row });
                    }}
                  >
                    <TileThumbnail img={img} ts={ts} tileIndex={i} size={SWATCH_SIZE} />
                    {hasAnimation && <span className="tile-swatch__anim-badge">▶</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="map-toolrow">
        <button className={`btn${activeTool === "terrain" ? " btn--primary" : ""}`} disabled={!activeStamp} onClick={() => setActiveTool("terrain")}>
          Vẽ {activeStamp ? `(${activeStamp.width}×${activeStamp.height})` : ""}
        </button>
        <button className={`btn${activeTool === "erase" ? " btn--primary" : ""}`} onClick={() => setActiveTool("erase")}>
          Xoá (Eraser)
        </button>
      </div>

      <div className="map-toolrow">
        <button
          className="btn btn--sm"
          disabled={!activeStamp}
          title="Đổ đầy toàn bộ layer đang chọn bằng tile/vùng đang chọn"
          onClick={() => fillLayer()}
        >
          🪣 Tô hết layer
        </button>
      </div>

      {activeTool === "erase" && (
        <div className="map-toolrow">
          <span className="map-toolrow__label">Cỡ tẩy</span>
          {([1, 2, 3] as const).map((n) => (
            <button key={n} className={`btn btn--sm${eraserSize === n ? " btn--primary" : ""}`} onClick={() => setEraserSize(n)}>
              {n}×{n}
            </button>
          ))}
        </div>
      )}

      {activeStamp && activeStamp.width === 1 && activeStamp.height === 1 && (
        <div className="map-toolrow">
          <button
            className={`btn btn--sm${editingAnim?.tilesetId === activeStamp.tilesetId && editingAnim?.baseTileIndex === activeStamp.tiles[0] ? " btn--primary" : ""}`}
            onClick={() => {
              const baseTileIndex = activeStamp.tiles[0];
              if (editingAnim?.tilesetId === activeStamp.tilesetId && editingAnim.baseTileIndex === baseTileIndex) {
                setEditingAnim(null);
                setPickingFrame(false);
              } else {
                setEditingAnim({ tilesetId: activeStamp.tilesetId, baseTileIndex });
                setPickingFrame(false);
              }
            }}
          >
            🎞 Animation cho ô #{activeStamp.tiles[0]}
          </button>
        </div>
      )}

      {editingAnim && editingTileset && (
        <div className="anim-editor">
          <div className="anim-editor__header">
            <span>
              Animation — {editingTileset.name} #{editingAnim.baseTileIndex}
            </span>
            <button
              className="tileset-block__remove"
              title="Đóng"
              onClick={() => {
                setEditingAnim(null);
                setPickingFrame(false);
              }}
            >
              ✕
            </button>
          </div>

          {editingFrames.length === 0 && <p className="inspector__empty inspector__empty--inline">Chưa có frame nào — tile này đang tĩnh.</p>}

          <div className="anim-editor__frames">
            {editingFrames.map((frame, idx) => (
              <div key={idx} className="anim-frame">
                <TileThumbnail img={images.get(editingTileset.id)} ts={editingTileset} tileIndex={frame.tileIndex} size={24} />
                <input
                  className="field-input field-input--sm"
                  type="number"
                  min={10}
                  value={frame.duration}
                  onChange={(e) => {
                    const duration = Math.max(10, Number(e.target.value) || 10);
                    const next = editingFrames.map((f, i) => (i === idx ? { ...f, duration } : f));
                    setTileAnimationFrames(editingTileset.id, editingAnim.baseTileIndex, next);
                  }}
                />
                <span className="anim-frame__unit">ms</span>
                <button
                  className="tileset-block__remove"
                  title="Xoá frame"
                  onClick={() => {
                    const next = editingFrames.filter((_, i) => i !== idx);
                    setTileAnimationFrames(editingTileset.id, editingAnim.baseTileIndex, next);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="map-toolrow">
            <button className={`btn btn--sm${pickingFrame ? " btn--primary" : ""}`} onClick={() => setPickingFrame((v) => !v)}>
              {pickingFrame ? "Kéo bôi đen 1+ ô trong bảng…" : "+ Thêm frame"}
            </button>
            {editingFrames.length > 0 && (
              <button className="btn btn--sm" onClick={() => setTileAnimationFrames(editingTileset.id, editingAnim.baseTileIndex, [])}>
                Xoá animation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
