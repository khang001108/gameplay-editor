import { useEffect, useRef, useState } from "react";
import { useMapStore } from "../../../state/mapStore";
import type { MapTool } from "../../../state/mapStore";
import { getMapObjectDefinition } from "../../../mapDefinitions";
import { clamp } from "../../../utils/clamp";
import type { AreaKind } from "../../../types/map";
import { useTilesetImages } from "../useTilesetImages";
import { tileSourceRect, resolveAnimatedTileIndex } from "../tileGeometry";
import { useThemeStore } from "../../../state/themeStore";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function areaKindFromTool(tool: MapTool): AreaKind | null {
  if (tool === "area-spawn") return "spawn";
  if (tool === "area-trigger") return "trigger";
  if (tool === "area-boundary") return "boundary";
  return null;
}

const TOOL_LABEL: Record<MapTool, string> = {
  select: "Chọn / Di chuyển",
  terrain: "Vẽ terrain",
  erase: "Xoá terrain (eraser)",
  "area-spawn": "Chạm/kéo để vẽ Spawn Area",
  "area-trigger": "Chạm/kéo để vẽ Trigger Area",
  "area-boundary": "Chạm/kéo để vẽ Boundary",
  "place-object": "Chạm vào canvas để đặt",
};

interface Point {
  x: number;
  y: number;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function MapCanvas() {
  const width = useMapStore((s) => s.width);
  const height = useMapStore((s) => s.height);
  const tileSize = useMapStore((s) => s.tileSize);
  const tilesets = useMapStore((s) => s.tilesets);
  const layers = useMapStore((s) => s.layers);
  const objects = useMapStore((s) => s.objects);
  const areas = useMapStore((s) => s.areas);
  const selected = useMapStore((s) => s.selected);
  const activeTool = useMapStore((s) => s.activeTool);
  const activeStamp = useMapStore((s) => s.activeStamp);
  const eraserSize = useMapStore((s) => s.eraserSize);
  const pendingPlacement = useMapStore((s) => s.pendingPlacement);

  const paintCell = useMapStore((s) => s.paintCell);
  const eraseCell = useMapStore((s) => s.eraseCell);
  const placeObject = useMapStore((s) => s.placeObject);
  const positionObject = useMapStore((s) => s.positionObject);
  const addArea = useMapStore((s) => s.addArea);
  const select = useMapStore((s) => s.select);
  const removeSelected = useMapStore((s) => s.removeSelected);
  const setActiveTool = useMapStore((s) => s.setActiveTool);
  const cancelPlacement = useMapStore((s) => s.cancelPlacement);
  const checkpoint = useMapStore((s) => s.checkpoint);
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);
  const theme = useThemeStore((s) => s.theme);

  const [zoom, setZoom] = useState(1);
  const effectiveTileSize = tileSize * zoom;

  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useTilesetImages(tilesets);

  const stageWidth = width * effectiveTileSize;
  const stageHeight = height * effectiveTileSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hasAnimatedTiles = tilesets.some((ts) => Object.keys(ts.animations).length > 0);
    const gridStroke = theme === "light" ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)";

    const draw = (nowMs: number) => {
      canvas.width = stageWidth;
      canvas.height = stageHeight;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, stageWidth, stageHeight);

      // vẽ từng layer theo thứ tự trong mảng (đầu = dưới cùng, cuối = trên cùng), bỏ qua layer đang ẩn
      for (const layer of layers) {
        if (!layer.visible) continue;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const cell = layer.cells[y * width + x];
            if (!cell) continue;
            const ts = tilesets.find((t) => t.id === cell.tilesetId);
            const img = images.get(cell.tilesetId);
            if (ts && img && img.complete && img.naturalWidth > 0) {
              const drawIndex = resolveAnimatedTileIndex(ts, cell.tileIndex, nowMs);
              const { sx, sy, sw, sh } = tileSourceRect(ts, drawIndex);
              ctx.drawImage(img, sx, sy, sw, sh, x * effectiveTileSize, y * effectiveTileSize, effectiveTileSize, effectiveTileSize);
            }
          }
        }
      }

      ctx.strokeStyle = gridStroke;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          ctx.strokeRect(x * effectiveTileSize + 0.5, y * effectiveTileSize + 0.5, effectiveTileSize - 1, effectiveTileSize - 1);
        }
      }
    };

    let rafId: number;
    const loop = (nowMs: number) => {
      draw(nowMs);
      if (hasAnimatedTiles) rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [layers, tilesets, images, width, height, effectiveTileSize, stageWidth, stageHeight, theme]);

  const cellFromPoint = (clientX: number, clientY: number) => {
    const rect = stageRef.current!.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / effectiveTileSize);
    const y = Math.floor((clientY - rect.top) / effectiveTileSize);
    return { x: clamp(x, 0, width - 1), y: clamp(y, 0, height - 1) };
  };

  const isPaintingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // ô đang rê chuột/ngón tay tới — dùng để hiện khung xem trước đúng kích thước stamp/tẩy đang chọn
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  // theo dõi 2 ngón tay để pinch-zoom + pan (Map Editor không dùng thư viện canvas có sẵn nên tự implement)
  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const lastPinchRef = useRef<{ dist: number; mid: Point } | null>(null);

  const stopSingleGesture = () => {
    isPaintingRef.current = false;
    drawStartRef.current = null;
    setDrawPreview(null);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size >= 2) {
      stopSingleGesture();
      const pts = Array.from(activePointersRef.current.values()).slice(0, 2);
      lastPinchRef.current = { dist: distance(pts[0], pts[1]), mid: midpoint(pts[0], pts[1]) };
      return;
    }

    const cell = cellFromPoint(e.clientX, e.clientY);

    if (activeTool === "place-object" && pendingPlacement) {
      placeObject(pendingPlacement.defType, cell.x, cell.y);
      return;
    }

    const areaKind = areaKindFromTool(activeTool);
    if (areaKind) {
      drawStartRef.current = cell;
      setDrawPreview({ x: cell.x, y: cell.y, w: 1, h: 1 });
      return;
    }
    if (activeTool === "terrain") {
      isPaintingRef.current = true;
      checkpoint();
      paintCell(cell.x, cell.y);
      return;
    }
    if (activeTool === "erase") {
      isPaintingRef.current = true;
      checkpoint();
      eraseCell(cell.x, cell.y);
      return;
    }
    select(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size >= 2) {
      setHoverCell(null);
      const pts = Array.from(activePointersRef.current.values()).slice(0, 2);
      const dist = distance(pts[0], pts[1]);
      const mid = midpoint(pts[0], pts[1]);
      if (lastPinchRef.current) {
        const scaleDelta = dist / lastPinchRef.current.dist;
        setZoom((z) => clamp(z * scaleDelta, MIN_ZOOM, MAX_ZOOM));
        if (scrollRef.current) {
          scrollRef.current.scrollLeft -= mid.x - lastPinchRef.current.mid.x;
          scrollRef.current.scrollTop -= mid.y - lastPinchRef.current.mid.y;
        }
      }
      lastPinchRef.current = { dist, mid };
      return;
    }

    const cell = cellFromPoint(e.clientX, e.clientY);
    if (activeTool === "terrain" || activeTool === "erase") setHoverCell(cell);
    else if (hoverCell) setHoverCell(null);

    if (drawStartRef.current) {
      const sx = drawStartRef.current.x;
      const sy = drawStartRef.current.y;
      setDrawPreview({
        x: Math.min(sx, cell.x),
        y: Math.min(sy, cell.y),
        w: Math.abs(cell.x - sx) + 1,
        h: Math.abs(cell.y - sy) + 1,
      });
      return;
    }
    if (isPaintingRef.current) {
      if (activeTool === "terrain") paintCell(cell.x, cell.y);
      else if (activeTool === "erase") eraseCell(cell.x, cell.y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) lastPinchRef.current = null;
    if (activePointersRef.current.size > 0) return;

    isPaintingRef.current = false;
    if (drawStartRef.current && drawPreview) {
      const kind = areaKindFromTool(activeTool);
      if (kind) addArea(kind, drawPreview.x, drawPreview.y, drawPreview.w, drawPreview.h);
    }
    drawStartRef.current = null;
    setDrawPreview(null);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    setHoverCell(null);
    handlePointerUp(e);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    lastPinchRef.current = null;
    setHoverCell(null);
    stopSingleGesture();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.08 : 0.92), MIN_ZOOM, MAX_ZOOM));
  };

  // di chuyển object đã đặt bằng Pointer Events (thay HTML5 drag-and-drop — không chạy được trên cảm ứng)
  const objectDragRef = useRef<{ id: string; pointerId: number; offsetX: number; offsetY: number } | null>(null);

  const handleObjectPointerDown = (e: React.PointerEvent, objId: string) => {
    e.stopPropagation();
    select({ type: "object", id: objId });
    if (activeTool !== "select") return;
    const rect = e.currentTarget.getBoundingClientRect();
    objectDragRef.current = { id: objId, pointerId: e.pointerId, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    checkpoint();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleObjectPointerMove = (e: React.PointerEvent) => {
    const drag = objectDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const px = e.clientX - stageRect.left - drag.offsetX;
    const py = e.clientY - stageRect.top - drag.offsetY;
    positionObject(drag.id, Math.round(px / effectiveTileSize), Math.round(py / effectiveTileSize));
  };

  const handleObjectPointerUp = (e: React.PointerEvent) => {
    if (objectDragRef.current?.pointerId === e.pointerId) objectDragRef.current = null;
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (e.key === "Escape") {
        cancelPlacement();
        setActiveTool("select");
        drawStartRef.current = null;
        setDrawPreview(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !isTyping) {
        removeSelected();
      }
      if (!isTyping && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (!isTyping && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, removeSelected, setActiveTool, undo, redo, cancelPlacement]);

  return (
    <div className="map-canvas">
      <div className="map-canvas__toolbar">
        <span>{TOOL_LABEL[activeTool]}</span>
        {activeTool !== "select" && (
          <button
            className="btn btn--sm"
            onClick={() => {
              cancelPlacement();
              setActiveTool("select");
            }}
          >
            Xong (Esc)
          </button>
        )}
        <div className="map-canvas__zoom">
          <button className="btn btn--icon" title="Thu nhỏ" onClick={() => setZoom((z) => clamp(z / 1.2, MIN_ZOOM, MAX_ZOOM))}>
            −
          </button>
          <button className="btn btn--sm" title="Về 100%" onClick={() => setZoom(1)}>
            {Math.round(zoom * 100)}%
          </button>
          <button className="btn btn--icon" title="Phóng to" onClick={() => setZoom((z) => clamp(z * 1.2, MIN_ZOOM, MAX_ZOOM))}>
            +
          </button>
        </div>
      </div>

      <div className="map-canvas__scroll" ref={scrollRef} onWheel={handleWheel}>
        <div
          ref={stageRef}
          className="map-canvas__stage"
          style={{ width: stageWidth, height: stageHeight, touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
        >
          <canvas ref={canvasRef} className="map-canvas__terrain" />

          {areas.map((a) => {
            const isSelected = selected?.type === "area" && selected.id === a.id;
            return (
              <div
                key={a.id}
                className={`map-area map-area--${a.kind}${isSelected ? " map-area--selected" : ""}`}
                style={{
                  left: a.x * effectiveTileSize,
                  top: a.y * effectiveTileSize,
                  width: a.width * effectiveTileSize,
                  height: a.height * effectiveTileSize,
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  select({ type: "area", id: a.id });
                }}
              >
                <span className="map-area__label">{a.name}</span>
              </div>
            );
          })}

          {objects.map((o) => {
            const def = getMapObjectDefinition(o.defType);
            if (!def) return null;
            const isSelected = selected?.type === "object" && selected.id === o.id;
            return (
              <div
                key={o.id}
                className={`map-object${isSelected ? " map-object--selected" : ""}`}
                style={
                  {
                    left: o.x * effectiveTileSize,
                    top: o.y * effectiveTileSize,
                    width: def.footprintWidth * effectiveTileSize,
                    height: def.footprintHeight * effectiveTileSize,
                    "--accent": def.color,
                    touchAction: "none",
                  } as React.CSSProperties
                }
                onPointerDown={(e) => handleObjectPointerDown(e, o.id)}
                onPointerMove={handleObjectPointerMove}
                onPointerUp={handleObjectPointerUp}
                onPointerCancel={handleObjectPointerUp}
                title={def.label}
              >
                <span className="map-object__label">{def.label}</span>
              </div>
            );
          })}

          {drawPreview && (
            <div
              className="map-area-preview"
              style={{
                left: drawPreview.x * effectiveTileSize,
                top: drawPreview.y * effectiveTileSize,
                width: drawPreview.w * effectiveTileSize,
                height: drawPreview.h * effectiveTileSize,
              }}
            />
          )}

          {activeTool === "terrain" && activeStamp && hoverCell && (
            <div
              className="map-brush-preview"
              style={{
                left: hoverCell.x * effectiveTileSize,
                top: hoverCell.y * effectiveTileSize,
                width: activeStamp.width * effectiveTileSize,
                height: activeStamp.height * effectiveTileSize,
              }}
            >
              <span className="map-brush-preview__label">
                {activeStamp.width}×{activeStamp.height}
              </span>
            </div>
          )}

          {activeTool === "erase" && hoverCell && (
            <div
              className="map-brush-preview map-brush-preview--erase"
              style={{
                left: (hoverCell.x - Math.floor(eraserSize / 2)) * effectiveTileSize,
                top: (hoverCell.y - Math.floor(eraserSize / 2)) * effectiveTileSize,
                width: eraserSize * effectiveTileSize,
                height: eraserSize * effectiveTileSize,
              }}
            >
              <span className="map-brush-preview__label">
                {eraserSize}×{eraserSize}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
