import { useRef, useState } from "react";
import { useMapStore } from "../../../state/mapStore";
import { useUiStore } from "../../../state/uiStore";
import { useTilesetImages } from "../useTilesetImages";

const TILE_SIZE_MIN = 8;
const TILE_SIZE_MAX = 128;

/** Popup "Quản lý Tileset" — thay cho danh sách tileset xếp dài trong sidebar (phải cuộn rất nhiều
 * khi import nhiều ảnh). Import + xoá tileset ở đây, chọn 1 tileset (bấm vào card) để bắt đầu vẽ —
 * bảng chọn từng ô của tileset đó sẽ hiện ở panel bên phải (xem TilePickerPanel.tsx) thay vì Inspector. */
export function TilesetGalleryPopup() {
  const open = useUiStore((s) => s.tilesetGalleryOpen);
  const close = useUiStore((s) => s.closeTilesetGallery);

  const tilesets = useMapStore((s) => s.tilesets);
  const importTileset = useMapStore((s) => s.importTileset);
  const removeTileset = useMapStore((s) => s.removeTileset);
  const setActiveStamp = useMapStore((s) => s.setActiveStamp);
  const setActiveTool = useMapStore((s) => s.setActiveTool);

  const { images, isLoading } = useTilesetImages(tilesets);

  const [tileW, setTileW] = useState(32);
  const [tileH, setTileH] = useState(32);
  const [marginX, setMarginX] = useState(0);
  const [marginY, setMarginY] = useState(0);
  const [spacingX, setSpacingX] = useState(0);
  const [spacingY, setSpacingY] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

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

  const handleSelect = (id: string) => {
    setActiveStamp({ tilesetId: id, width: 1, height: 1, tiles: [0] });
    setActiveTool("terrain");
    close();
  };

  return (
    <div className="tileset-gallery-backdrop" onClick={close}>
      <div className="tileset-gallery" onClick={(e) => e.stopPropagation()}>
        <div className="tileset-gallery__header">
          <span>Quản lý Tileset</span>
          <button className="tileset-block__remove" title="Đóng" onClick={close}>
            ✕
          </button>
        </div>

        <div className="tileset-gallery__import">
          <div className="tileset-gallery__size-row">
            <label className="tileset-gallery__size-field">
              <span>
                Tile W <em>{tileW}px</em>
              </span>
              <input type="range" min={TILE_SIZE_MIN} max={TILE_SIZE_MAX} value={tileW} onChange={(e) => setTileW(Number(e.target.value))} />
            </label>
            <label className="tileset-gallery__size-field">
              <span>
                Tile H <em>{tileH}px</em>
              </span>
              <input type="range" min={TILE_SIZE_MIN} max={TILE_SIZE_MAX} value={tileH} onChange={(e) => setTileH(Number(e.target.value))} />
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
            <label>
              Spacing X
              <input className="field-input field-input--sm" type="number" min={0} value={spacingX} onChange={(e) => setSpacingX(Number(e.target.value) || 0)} />
            </label>
            <label>
              Spacing Y
              <input className="field-input field-input--sm" type="number" min={0} value={spacingY} onChange={(e) => setSpacingY(Number(e.target.value) || 0)} />
            </label>
          </div>
          <button className="btn btn--sm" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            {importing ? "Đang tải…" : "+ Import ảnh tileset"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </div>

        <div className="tileset-gallery__divider" />

        {tilesets.length === 0 ? (
          <p className="inspector__empty inspector__empty--inline">Chưa có tileset nào — import ảnh ở trên để bắt đầu.</p>
        ) : (
          <div className="tileset-gallery__grid">
            {tilesets.map((ts) => {
              const img = images.get(ts.id);
              const loading = isLoading(ts.id);
              return (
                <button key={ts.id} type="button" className="tileset-gallery__card" onClick={() => handleSelect(ts.id)}>
                  <span
                    className={`tileset-gallery__preview${loading ? " tileset-gallery__preview--loading" : ""}`}
                    style={img ? { backgroundImage: `url(${img.src})` } : undefined}
                  />
                  <span className="tileset-gallery__card-name" title={ts.name}>
                    {ts.name}
                  </span>
                  <span className="tileset-gallery__card-dims">
                    {ts.columns}×{ts.rows}
                  </span>
                  <span
                    className="tileset-gallery__card-remove"
                    role="button"
                    tabIndex={0}
                    title="Xoá tileset"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTileset(ts.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        removeTileset(ts.id);
                      }
                    }}
                  >
                    ✕
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
