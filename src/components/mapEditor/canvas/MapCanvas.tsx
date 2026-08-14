import { useEffect, useRef, useState } from "react";
import { useMapStore } from "../../../state/mapStore";
import type { MapTool } from "../../../state/mapStore";
import { getMapObjectDefinition } from "../../../mapDefinitions";
import { clamp } from "../../../utils/clamp";
import type { AreaKind } from "../../../types/map";
import { NEW_MAP_OBJECT_MIME, MOVE_MAP_OBJECT_MIME, type MoveObjectPayload } from "../dragTypes";
import { useTilesetImages } from "../useTilesetImages";
import { tileSourceRect, resolveAnimatedTileIndex } from "../tileGeometry";

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
  "area-spawn": "Kéo chuột để vẽ Spawn Area",
  "area-trigger": "Kéo chuột để vẽ Trigger Area",
  "area-boundary": "Kéo chuột để vẽ Boundary",
};

export function MapCanvas() {
  const width = useMapStore((s) => s.width);
  const height = useMapStore((s) => s.height);
  const tileSize = useMapStore((s) => s.tileSize);
  const tilesets = useMapStore((s) => s.tilesets);
  const terrain = useMapStore((s) => s.terrain);
  const objects = useMapStore((s) => s.objects);
  const areas = useMapStore((s) => s.areas);
  const selected = useMapStore((s) => s.selected);
  const activeTool = useMapStore((s) => s.activeTool);

  const paintCell = useMapStore((s) => s.paintCell);
  const eraseCell = useMapStore((s) => s.eraseCell);
  const placeObject = useMapStore((s) => s.placeObject);
  const moveObject = useMapStore((s) => s.moveObject);
  const addArea = useMapStore((s) => s.addArea);
  const select = useMapStore((s) => s.select);
  const removeSelected = useMapStore((s) => s.removeSelected);
  const setActiveTool = useMapStore((s) => s.setActiveTool);
  const checkpoint = useMapStore((s) => s.checkpoint);
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useTilesetImages(tilesets);

  const stageWidth = width * tileSize;
  const stageHeight = height * tileSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hasAnimatedTiles = tilesets.some((ts) => Object.keys(ts.animations).length > 0);

    const draw = (nowMs: number) => {
      canvas.width = stageWidth;
      canvas.height = stageHeight;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, stageWidth, stageHeight);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = terrain[y * width + x];
          if (cell) {
            const ts = tilesets.find((t) => t.id === cell.tilesetId);
            const img = images.get(cell.tilesetId);
            if (ts && img && img.complete && img.naturalWidth > 0) {
              const drawIndex = resolveAnimatedTileIndex(ts, cell.tileIndex, nowMs);
              const { sx, sy, sw, sh } = tileSourceRect(ts, drawIndex);
              ctx.drawImage(img, sx, sy, sw, sh, x * tileSize, y * tileSize, tileSize, tileSize);
            }
          }
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.strokeRect(x * tileSize + 0.5, y * tileSize + 0.5, tileSize - 1, tileSize - 1);
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
  }, [terrain, tilesets, images, width, height, tileSize, stageWidth, stageHeight]);

  const cellFromEvent = (e: { clientX: number; clientY: number }) => {
    const rect = stageRef.current!.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / tileSize);
    const y = Math.floor((e.clientY - rect.top) / tileSize);
    return { x: clamp(x, 0, width - 1), y: clamp(y, 0, height - 1) };
  };

  const isPaintingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const cell = cellFromEvent(e);
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

  const handleMouseMove = (e: React.MouseEvent) => {
    const cell = cellFromEvent(e);
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

  const handleMouseUp = () => {
    isPaintingRef.current = false;
    if (drawStartRef.current && drawPreview) {
      const kind = areaKindFromTool(activeTool);
      if (kind) addArea(kind, drawPreview.x, drawPreview.y, drawPreview.w, drawPreview.h);
    }
    drawStartRef.current = null;
    setDrawPreview(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = stageRef.current!.getBoundingClientRect();

    const newType = e.dataTransfer.getData(NEW_MAP_OBJECT_MIME);
    if (newType) {
      const gx = Math.floor((e.clientX - rect.left) / tileSize);
      const gy = Math.floor((e.clientY - rect.top) / tileSize);
      placeObject(newType, gx, gy);
      return;
    }

    const moveRaw = e.dataTransfer.getData(MOVE_MAP_OBJECT_MIME);
    if (moveRaw) {
      try {
        const payload = JSON.parse(moveRaw) as MoveObjectPayload;
        const px = e.clientX - rect.left - payload.offsetX;
        const py = e.clientY - rect.top - payload.offsetY;
        moveObject(payload.id, Math.round(px / tileSize), Math.round(py / tileSize));
      } catch {
        /* payload kéo-thả không hợp lệ — bỏ qua */
      }
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (e.key === "Escape") {
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
  }, [selected, removeSelected, setActiveTool, undo, redo]);

  return (
    <div className="map-canvas">
      <div className="map-canvas__toolbar">
        <span>{TOOL_LABEL[activeTool]}</span>
        {activeTool !== "select" && (
          <button className="btn btn--sm" onClick={() => setActiveTool("select")}>
            Xong (Esc)
          </button>
        )}
      </div>

      <div className="map-canvas__scroll">
        <div
          ref={stageRef}
          className="map-canvas__stage"
          style={{ width: stageWidth, height: stageHeight }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <canvas ref={canvasRef} className="map-canvas__terrain" />

          {areas.map((a) => {
            const isSelected = selected?.type === "area" && selected.id === a.id;
            return (
              <div
                key={a.id}
                className={`map-area map-area--${a.kind}${isSelected ? " map-area--selected" : ""}`}
                style={{ left: a.x * tileSize, top: a.y * tileSize, width: a.width * tileSize, height: a.height * tileSize }}
                onMouseDown={(e) => {
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
                    left: o.x * tileSize,
                    top: o.y * tileSize,
                    width: def.footprintWidth * tileSize,
                    height: def.footprintHeight * tileSize,
                    "--accent": def.color,
                  } as React.CSSProperties
                }
                draggable={activeTool === "select"}
                onDragStart={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const payload: MoveObjectPayload = { id: o.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
                  e.dataTransfer.setData(MOVE_MAP_OBJECT_MIME, JSON.stringify(payload));
                  e.dataTransfer.effectAllowed = "move";
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  select({ type: "object", id: o.id });
                }}
                title={def.label}
              >
                <span className="map-object__label">{def.label}</span>
              </div>
            );
          })}

          {drawPreview && (
            <div
              className="map-area-preview"
              style={{ left: drawPreview.x * tileSize, top: drawPreview.y * tileSize, width: drawPreview.w * tileSize, height: drawPreview.h * tileSize }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
