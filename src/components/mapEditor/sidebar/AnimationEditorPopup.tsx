import { useEffect, useRef } from "react";
import { useMapStore } from "../../../state/mapStore";
import { TileThumbnail } from "./TileThumbnail";
import { tileSourceRect, resolveAnimatedTileIndex } from "../tileGeometry";
import type { TilesetDef } from "../../../types/map";

const PREVIEW_CELL = 40;
const FRAME_THUMB = 18;

interface FrameSlot {
  duration: number;
  /** 1 tileIndex mỗi vị trí trong block, row-major — cùng độ dài với baseTiles */
  tiles: number[];
}

/** Ghép animations riêng của từng ô trong block thành danh sách frame "đồng bộ" — frame thứ i của
 * block là tổ hợp frame thứ i của TỪNG ô (đã được thêm cùng lúc nên luôn khớp độ dài/thời lượng). */
function buildFrameSlots(tileset: TilesetDef, baseTiles: number[]): FrameSlot[] {
  const perPosition = baseTiles.map((baseIndex) => tileset.animations[baseIndex] ?? []);
  const frameCount = Math.max(0, ...perPosition.map((f) => f.length));
  const slots: FrameSlot[] = [];
  for (let i = 0; i < frameCount; i++) {
    slots.push({
      duration: perPosition[0]?.[i]?.duration ?? 200,
      tiles: perPosition.map((frames, pos) => frames[i]?.tileIndex ?? baseTiles[pos]),
    });
  }
  return slots;
}

function AnimationPreview({
  tileset,
  img,
  baseTiles,
  width,
  height,
}: {
  tileset: TilesetDef;
  img: HTMLImageElement | undefined;
  baseTiles: number[];
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = width * PREVIEW_CELL;
    canvas.height = height * PREVIEW_CELL;
    ctx.imageSmoothingEnabled = false;

    let rafId: number;
    const draw = (nowMs: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (img && img.complete && img.naturalWidth > 0) {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const baseIndex = baseTiles[y * width + x];
            const drawIndex = resolveAnimatedTileIndex(tileset, baseIndex, nowMs);
            const { sx, sy, sw, sh } = tileSourceRect(tileset, drawIndex);
            ctx.drawImage(img, sx, sy, sw, sh, x * PREVIEW_CELL, y * PREVIEW_CELL, PREVIEW_CELL, PREVIEW_CELL);
          }
        }
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [tileset, img, baseTiles, width, height]);

  return <canvas ref={canvasRef} className="anim-popup__preview-canvas" />;
}

interface AnimationEditorPopupProps {
  tileset: TilesetDef;
  img: HTMLImageElement | undefined;
  baseTiles: number[];
  width: number;
  height: number;
  pickingFrame: boolean;
  onTogglePicking: () => void;
  onClose: () => void;
}

export function AnimationEditorPopup({
  tileset,
  img,
  baseTiles,
  width,
  height,
  pickingFrame,
  onTogglePicking,
  onClose,
}: AnimationEditorPopupProps) {
  const setTileAnimationFramesForMany = useMapStore((s) => s.setTileAnimationFramesForMany);

  const frames = buildFrameSlots(tileset, baseTiles);

  const applyFrames = (updater: (slots: FrameSlot[]) => FrameSlot[]) => {
    const nextSlots = updater(frames);
    const entries = baseTiles.map((baseTileIndex, pos) => ({
      baseTileIndex,
      frames: nextSlots.map((slot) => ({ tileIndex: slot.tiles[pos], duration: slot.duration })),
    }));
    setTileAnimationFramesForMany(tileset.id, entries);
  };

  return (
    <div className="anim-popup">
      <div className="anim-popup__header">
        <span>
          Animation — {tileset.name} ({width}×{height})
        </span>
        <button className="tileset-block__remove" title="Đóng" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="anim-popup__preview">
        <AnimationPreview tileset={tileset} img={img} baseTiles={baseTiles} width={width} height={height} />
        {frames.length === 0 && <p className="anim-popup__preview-hint">Chưa có frame — block đang tĩnh.</p>}
      </div>

      {frames.length > 0 && (
        <div className="anim-popup__frames">
          {frames.map((slot, idx) => (
            <div key={idx} className="anim-popup__frame-row">
              <span className="anim-popup__frame-index">#{idx + 1}</span>
              <div className="anim-popup__frame-grid" style={{ gridTemplateColumns: `repeat(${width}, ${FRAME_THUMB}px)` }}>
                {slot.tiles.map((tileIndex, pos) => (
                  <TileThumbnail key={pos} img={img} ts={tileset} tileIndex={tileIndex} size={FRAME_THUMB} />
                ))}
              </div>
              <input
                className="field-input field-input--sm"
                type="number"
                min={10}
                value={slot.duration}
                onChange={(e) => {
                  const duration = Math.max(10, Number(e.target.value) || 10);
                  applyFrames((slots) => slots.map((s, i) => (i === idx ? { ...s, duration } : s)));
                }}
              />
              <span className="anim-frame__unit">ms</span>
              <button className="tileset-block__remove" title="Xoá frame" onClick={() => applyFrames((slots) => slots.filter((_, i) => i !== idx))}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="map-toolrow">
        <button className={`btn btn--sm${pickingFrame ? " btn--primary" : ""}`} onClick={onTogglePicking}>
          {pickingFrame ? (width === 1 && height === 1 ? "Kéo bôi đen 1+ ô…" : `Kéo đúng ${width}×${height} ô…`) : "+ Thêm frame"}
        </button>
        {frames.length > 0 && (
          <button className="btn btn--sm" onClick={() => applyFrames(() => [])}>
            Xoá animation
          </button>
        )}
      </div>

      <p className="field-row__help">
        {width === 1 && height === 1
          ? "Kéo bôi đen nhiều ô cùng lúc trong bảng để nối thêm nhiều frame liên tiếp."
          : `Mỗi lần thêm phải kéo đúng vùng ${width}×${height} ô — ô nào khớp đúng vị trí ô đó (1↔1, 2↔2...), tạo animation đồng bộ cho cả block.`}
      </p>
    </div>
  );
}
