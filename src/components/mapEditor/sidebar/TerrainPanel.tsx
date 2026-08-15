import { useEffect, useRef, useState } from "react";
import { useMapStore } from "../../../state/mapStore";
import { useTilesetImages } from "../useTilesetImages";
import { TileThumbnail } from "./TileThumbnail";
import { LayersPanel } from "./LayersPanel";
import { AnimationEditorPopup } from "./AnimationEditorPopup";
import type { TilesetDef, TileAnimationFrame } from "../../../types/map";

const SWATCH_SIZE = 28;

interface DragCell {
  col: number;
  row: number;
}

function sameTiles(a: number[] | undefined, b: number[]): boolean {
  if (!a || a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/** cây thư mục dựng từ TilesetDef.folderPath — mô phỏng đúng cấu trúc folder/subfolder lúc import
 * cả folder, để hiện trong sidebar giống mở folder trên máy (mở/đóng từng cấp riêng). */
interface TilesetFolderNode {
  name: string;
  path: string;
  children: Map<string, TilesetFolderNode>;
  tilesets: TilesetDef[];
}

function buildTilesetTree(list: TilesetDef[]): TilesetFolderNode {
  const root: TilesetFolderNode = { name: "", path: "", children: new Map(), tilesets: [] };
  for (const ts of list) {
    if (!ts.folderPath) {
      root.tilesets.push(ts);
      continue;
    }
    const parts = ts.folderPath.split("/").filter(Boolean);
    let node = root;
    let acc = "";
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      let child = node.children.get(part);
      if (!child) {
        child = { name: part, path: acc, children: new Map(), tilesets: [] };
        node.children.set(part, child);
      }
      node = child;
    }
    node.tilesets.push(ts);
  }
  return root;
}

function countTilesetsInTree(node: TilesetFolderNode): number {
  let n = node.tilesets.length;
  for (const child of node.children.values()) n += countTilesetsInTree(child);
  return n;
}

export function TerrainPanel() {
  const tilesets = useMapStore((s) => s.tilesets);
  const activeStamp = useMapStore((s) => s.activeStamp);
  const importTileset = useMapStore((s) => s.importTileset);
  const importTilesetFiles = useMapStore((s) => s.importTilesetFiles);
  const removeTileset = useMapStore((s) => s.removeTileset);
  const setActiveStamp = useMapStore((s) => s.setActiveStamp);
  const setTileAnimationFrames = useMapStore((s) => s.setTileAnimationFrames);
  const setTileAnimationFramesForMany = useMapStore((s) => s.setTileAnimationFramesForMany);

  const images = useTilesetImages(tilesets);

  const [tileW, setTileW] = useState(32);
  const [tileH, setTileH] = useState(32);
  const [marginX, setMarginX] = useState(0);
  const [marginY, setMarginY] = useState(0);
  const [spacingX, setSpacingX] = useState(0);
  const [spacingY, setSpacingY] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // webkitdirectory/directory không có trong kiểu InputHTMLAttributes chuẩn của React — gắn trực tiếp qua DOM
    folderInputRef.current?.setAttribute("webkitdirectory", "");
    folderInputRef.current?.setAttribute("directory", "");
  }, []);

  // kéo chuột trên bảng tile để chọn 1 vùng nhiều ô (giống Tiled) — dùng chung cho cả chọn stamp
  // để vẽ VÀ chọn nhiều ô liền lúc thêm animation frame (xem dragPurpose)
  const [dragTilesetId, setDragTilesetId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<DragCell | null>(null);
  const [dragCur, setDragCur] = useState<DragCell | null>(null);
  const [dragPurpose, setDragPurpose] = useState<"stamp" | "frames">("stamp");

  // sửa animation cho 1 block (1 ô hoặc nhiều ô — chính là activeStamp lúc bấm "🎞 Animation"):
  // bấm "+ Thêm frame" rồi kéo bôi đen trong bảng để nối thêm frame. Block 1 ô: mọi ô kéo qua là
  // 1 frame riêng nối tuần tự. Block nhiều ô: phải kéo đúng kích thước, khớp theo vị trí (1↔1, 2↔2...).
  const [editingAnim, setEditingAnim] = useState<{ tilesetId: string; baseTiles: number[]; width: number; height: number } | null>(null);
  const [pickingFrame, setPickingFrame] = useState(false);

  const editingTileset = editingAnim ? tilesets.find((t) => t.id === editingAnim.tilesetId) : undefined;

  // folder nào đang thu gọn — mặc định mở hết (giống mở folder ra thấy ngay bên trong), bấm để đóng/mở riêng từng cấp
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

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

  const handleFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.target.files là FileList "sống" — phải đọc ra mảng TRƯỚC khi clear value, nếu không clear sẽ làm rỗng luôn cả list này
    const imageFiles = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (imageFiles.length === 0) {
      window.alert("Không tìm thấy ảnh nào trong folder đã chọn.");
      return;
    }
    setImporting(true);
    try {
      await importTilesetFiles(imageFiles, Math.max(1, tileW), Math.max(1, tileH), Math.max(0, marginX), Math.max(0, marginY), Math.max(0, spacingX), Math.max(0, spacingY));
    } catch {
      window.alert("Có lỗi khi đọc ảnh trong folder — kiểm tra lại và thử lại.");
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
            setTileAnimationFrames(editingAnim.tilesetId, baseTileIndex, [...currentFrames, ...newFrames]);
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
            setTileAnimationFramesForMany(editingAnim.tilesetId, entries);
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
      setDragTilesetId(null);
      setDragStart(null);
      setDragCur(null);
    };
    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, [dragTilesetId, dragStart, dragCur, dragPurpose, editingAnim, tilesets, setActiveStamp, setTileAnimationFrames, setTileAnimationFramesForMany]);

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

  const renderTilesetBlock = (ts: TilesetDef) => {
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
        <div className="tile-palette" style={{ gridTemplateColumns: `repeat(${ts.columns}, ${SWATCH_SIZE}px)` }}>
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
  };

  const renderFolderNode = (node: TilesetFolderNode): React.ReactNode => {
    const collapsed = collapsedFolders.has(node.path);
    return (
      <div key={node.path} className="tileset-folder">
        <button type="button" className="tileset-folder__header" onClick={() => toggleFolder(node.path)}>
          <span className="tileset-folder__chevron">{collapsed ? "▸" : "▾"}</span>
          <span className="tileset-folder__icon">📁</span>
          <span className="tileset-folder__name">{node.name}</span>
          <span className="tileset-folder__count">{countTilesetsInTree(node)}</span>
        </button>
        {!collapsed && (
          <div className="tileset-folder__body">
            {Array.from(node.children.values()).map((child) => renderFolderNode(child))}
            {node.tilesets.map((ts) => renderTilesetBlock(ts))}
          </div>
        )}
      </div>
    );
  };

  const tilesetTree = buildTilesetTree(tilesets);

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

      <div className="map-toolrow">
        <button className="btn btn--sm" disabled={importing} onClick={() => fileInputRef.current?.click()}>
          {importing ? "Đang tải…" : "+ Import ảnh"}
        </button>
        <button className="btn btn--sm" disabled={importing} onClick={() => folderInputRef.current?.click()}>
          {importing ? "Đang tải…" : "+ Import cả folder"}
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <input ref={folderInputRef} type="file" accept="image/*" multiple hidden onChange={handleFolder} />

      {tilesets.length === 0 && <p className="inspector__empty inspector__empty--inline">Chưa có tileset nào.</p>}

      {tilesetTree.tilesets.map((ts) => renderTilesetBlock(ts))}
      {Array.from(tilesetTree.children.values()).map((child) => renderFolderNode(child))}

      {activeStamp && (
        <div className="map-toolrow">
          <button
            className={`btn btn--sm${editingAnim?.tilesetId === activeStamp.tilesetId && sameTiles(editingAnim?.baseTiles, activeStamp.tiles) ? " btn--primary" : ""}`}
            onClick={() => {
              const isSame = editingAnim?.tilesetId === activeStamp.tilesetId && sameTiles(editingAnim?.baseTiles, activeStamp.tiles);
              if (isSame) {
                setEditingAnim(null);
                setPickingFrame(false);
              } else {
                setEditingAnim({ tilesetId: activeStamp.tilesetId, baseTiles: activeStamp.tiles, width: activeStamp.width, height: activeStamp.height });
                setPickingFrame(false);
              }
            }}
          >
            🎞 Animation cho block {activeStamp.width}×{activeStamp.height}
          </button>
        </div>
      )}

      {editingAnim && editingTileset && (
        <AnimationEditorPopup
          tileset={editingTileset}
          img={images.get(editingTileset.id)}
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
    </div>
  );
}
