import { useRef, useState } from "react";
import { useMapStore } from "../../../state/mapStore";

export function TerrainPanel() {
  const tilesets = useMapStore((s) => s.tilesets);
  const activeTilesetId = useMapStore((s) => s.activeTilesetId);
  const activeTileIndex = useMapStore((s) => s.activeTileIndex);
  const activeTool = useMapStore((s) => s.activeTool);
  const brushSize = useMapStore((s) => s.brushSize);
  const tileSize = useMapStore((s) => s.tileSize);
  const importTileset = useMapStore((s) => s.importTileset);
  const removeTileset = useMapStore((s) => s.removeTileset);
  const setActiveTile = useMapStore((s) => s.setActiveTile);
  const setActiveTool = useMapStore((s) => s.setActiveTool);
  const setBrushSize = useMapStore((s) => s.setBrushSize);

  const [tileW, setTileW] = useState(tileSize);
  const [tileH, setTileH] = useState(tileSize);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      await importTileset(file, Math.max(1, tileW), Math.max(1, tileH));
    } catch {
      window.alert("Không đọc được ảnh tileset — thử lại với file PNG/JPG khác.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="map-sidebar__section">
      <div className="sidebar__hint">Import ảnh tileset (PNG), chọn 1 tile rồi vẽ trực tiếp lên canvas.</div>

      <div className="tileset-import">
        <label>
          Tile W (px)
          <input
            className="field-input field-input--sm"
            type="number"
            min={1}
            value={tileW}
            onChange={(e) => setTileW(Number(e.target.value) || 1)}
          />
        </label>
        <label>
          Tile H (px)
          <input
            className="field-input field-input--sm"
            type="number"
            min={1}
            value={tileH}
            onChange={(e) => setTileH(Number(e.target.value) || 1)}
          />
        </label>
      </div>
      <button className="btn" disabled={importing} onClick={() => fileInputRef.current?.click()}>
        {importing ? "Đang tải…" : "+ Import ảnh tileset"}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />

      {tilesets.length === 0 && <p className="inspector__empty inspector__empty--inline">Chưa có tileset nào.</p>}

      {tilesets.map((ts) => (
        <div key={ts.id} className="tileset-block">
          <div className="tileset-block__header">
            <span>
              {ts.name} <em>({ts.columns}×{ts.rows})</em>
            </span>
            <button className="tileset-block__remove" title="Xoá tileset" onClick={() => removeTileset(ts.id)}>
              ✕
            </button>
          </div>
          <div className="tile-palette">
            {Array.from({ length: ts.columns * ts.rows }).map((_, i) => {
              const col = i % ts.columns;
              const row = Math.floor(i / ts.columns);
              const isActive = activeTilesetId === ts.id && activeTileIndex === i;
              return (
                <button
                  key={i}
                  className={`tile-swatch${isActive ? " tile-swatch--active" : ""}`}
                  style={{
                    width: ts.tileWidth,
                    height: ts.tileHeight,
                    backgroundImage: `url(${ts.imageDataUrl})`,
                    backgroundPosition: `-${col * ts.tileWidth}px -${row * ts.tileHeight}px`,
                    backgroundSize: `${ts.columns * ts.tileWidth}px ${ts.rows * ts.tileHeight}px`,
                  }}
                  onClick={() => setActiveTile(ts.id, i)}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="map-toolrow">
        <button className={`btn${activeTool === "terrain" ? " btn--primary" : ""}`} onClick={() => setActiveTool("terrain")}>
          Vẽ
        </button>
        <button className={`btn${activeTool === "erase" ? " btn--primary" : ""}`} onClick={() => setActiveTool("erase")}>
          Xoá (Eraser)
        </button>
      </div>

      <div className="map-toolrow">
        <span className="map-toolrow__label">Cỡ cọ</span>
        {([1, 2, 3] as const).map((n) => (
          <button key={n} className={`btn btn--sm${brushSize === n ? " btn--primary" : ""}`} onClick={() => setBrushSize(n)}>
            {n}×{n}
          </button>
        ))}
      </div>
    </div>
  );
}
