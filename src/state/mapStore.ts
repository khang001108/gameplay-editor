import { create } from "zustand";
import type { AreaKind, MapArea, MapDocument, MapObject, TerrainCellRef, TerrainLayer, TileAnimationFrame, TilesetDef } from "../types/map";
import type { FieldValue } from "../types/graph";
import { getMapObjectDefinition } from "../mapDefinitions";
import { makeId } from "../utils/id";
import { clamp } from "../utils/clamp";
import { readFileAsDataURL, loadImage } from "../utils/image";
import { serializeMap } from "../serialization/mapSerializer";
import { deserializeMap, isMapDocument } from "../serialization/mapDeserializer";
import { emptyMapDocument } from "../serialization/mapSchema";

export type MapTool = "select" | "terrain" | "erase" | "area-spawn" | "area-trigger" | "area-boundary" | "place-object";

export type MapSelection = { type: "object" | "area"; id: string } | null;

/** 1 vùng tile đã chọn trong bảng tileset — vẽ được nhiều ô cùng lúc, giữ đúng bố cục như lúc chọn (kiểu Tiled) */
export interface TileStamp {
  tilesetId: string;
  width: number;
  height: number;
  /** mảng phẳng row-major, độ dài = width*height, mỗi phần tử là tileIndex trong tileset */
  tiles: number[];
}

/** phần state được Undo/Redo theo dõi — không gồm lựa chọn/tool đang bật vì đó không phải nội dung map */
interface MapContentSnapshot {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tilesets: TilesetDef[];
  layers: TerrainLayer[];
  objects: MapObject[];
  areas: MapArea[];
}

const MAX_HISTORY = 50;

interface MapState {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tilesets: TilesetDef[];
  layers: TerrainLayer[];
  /** layer đang được vẽ/xoá — Vẽ/Xoá (eraser) luôn tác động lên đúng layer này */
  activeLayerId: string;
  objects: MapObject[];
  areas: MapArea[];

  selected: MapSelection;
  activeTool: MapTool;
  activeStamp: TileStamp | null;
  eraserSize: 1 | 2 | 3;
  /** building/unit đang "chọn sẵn" từ palette, chờ chạm/click vào canvas để đặt — dùng chung cho chuột lẫn cảm ứng
   * (thay cho kéo-thả HTML5 vốn không hoạt động trên di động). */
  pendingPlacement: { defType: string } | null;
  armPlacement: (defType: string) => void;
  cancelPlacement: () => void;
  lastLoadWarnings: string[];

  /** id dòng trên Supabase nếu map này đã từng lưu Cloud — null nghĩa là "Lưu Cloud" sẽ tạo dòng mới */
  cloudId: string | null;
  setCloudId: (id: string | null) => void;

  past: MapContentSnapshot[];
  future: MapContentSnapshot[];
  /** lưu 1 mốc undo tại thời điểm hiện tại — gọi TRƯỚC khi áp thay đổi. Canvas tự gọi khi bắt đầu 1 nét vẽ/xoá
   * (vì paintCell/eraseCell gọi liên tục lúc kéo chuột, không thể tự chốt mốc ở từng ô). */
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;

  setName: (name: string) => void;
  resizeMap: (width: number, height: number) => void;
  setTileSize: (tileSize: number) => void;

  importTileset: (
    file: File,
    tileWidth: number,
    tileHeight: number,
    marginX: number,
    marginY: number,
    spacingX: number,
    spacingY: number
  ) => Promise<void>;
  removeTileset: (id: string) => void;
  setTileAnimationFrames: (tilesetId: string, baseTileIndex: number, frames: TileAnimationFrame[]) => void;
  /** đổi animation cho nhiều ô cùng lúc, checkpoint đúng 1 lần — dùng để giữ đồng bộ khi 1 block
   * nhiều ô (vd 4×4) được gắn animation, mỗi ô trong block đều phải thêm/xoá/sửa frame cùng lúc. */
  setTileAnimationFramesForMany: (tilesetId: string, entries: { baseTileIndex: number; frames: TileAnimationFrame[] }[]) => void;

  addLayer: () => void;
  removeLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  setActiveLayer: (id: string) => void;

  setActiveTool: (tool: MapTool) => void;
  setActiveStamp: (stamp: TileStamp) => void;
  setEraserSize: (n: 1 | 2 | 3) => void;
  paintCell: (x: number, y: number) => void;
  eraseCell: (x: number, y: number) => void;
  /** đổ đầy toàn bộ layer đang chọn bằng activeStamp — nếu stamp nhiều hơn 1 ô thì lặp lại (tile) kín cả layer */
  fillLayer: () => void;

  placeObject: (defType: string, x: number, y: number) => void;
  /** dùng cho 1 thao tác đơn lẻ (vd sửa X/Y trong Inspector) — tự checkpoint */
  moveObject: (id: string, x: number, y: number) => void;
  /** dùng khi đang KÉO object trên canvas — không tự checkpoint, gọi checkpoint() 1 lần lúc bắt đầu kéo */
  positionObject: (id: string, x: number, y: number) => void;
  updateObjectField: (id: string, key: string, value: FieldValue) => void;
  removeObject: (id: string) => void;

  addArea: (kind: AreaKind, x: number, y: number, width: number, height: number) => void;
  updateArea: (id: string, patch: Partial<Omit<MapArea, "id" | "kind">>) => void;
  removeArea: (id: string) => void;

  select: (selection: MapSelection) => void;
  removeSelected: () => void;

  exportDocument: () => MapDocument;
  loadDocument: (doc: unknown) => void;
  newMap: () => void;
}

const initialDoc = emptyMapDocument();

export const useMapStore = create<MapState>((set, get) => ({
  name: initialDoc.name,
  width: initialDoc.width,
  height: initialDoc.height,
  tileSize: initialDoc.tileSize,
  tilesets: [],
  layers: initialDoc.layers,
  activeLayerId: initialDoc.layers[0].id,
  objects: [],
  areas: [],

  selected: null,
  activeTool: "select",
  activeStamp: null,
  eraserSize: 1,
  pendingPlacement: null,
  armPlacement: (defType) => set({ pendingPlacement: { defType }, activeTool: "place-object", selected: null }),
  cancelPlacement: () => set((s) => (s.activeTool === "place-object" ? { pendingPlacement: null, activeTool: "select" } : {})),
  lastLoadWarnings: [],

  cloudId: null,
  setCloudId: (id) => set({ cloudId: id }),

  past: [],
  future: [],

  checkpoint: () => {
    const s = get();
    const snap: MapContentSnapshot = {
      name: s.name,
      width: s.width,
      height: s.height,
      tileSize: s.tileSize,
      tilesets: s.tilesets,
      layers: s.layers,
      objects: s.objects,
      areas: s.areas,
    };
    set({ past: [...s.past, snap].slice(-MAX_HISTORY), future: [] });
  },

  undo: () => {
    const s = get();
    const previous = s.past[s.past.length - 1];
    if (!previous) return;
    const snap: MapContentSnapshot = {
      name: s.name,
      width: s.width,
      height: s.height,
      tileSize: s.tileSize,
      tilesets: s.tilesets,
      layers: s.layers,
      objects: s.objects,
      areas: s.areas,
    };
    set({
      ...previous,
      activeLayerId: previous.layers.some((l) => l.id === s.activeLayerId) ? s.activeLayerId : previous.layers[0].id,
      past: s.past.slice(0, -1),
      future: [...s.future, snap].slice(-MAX_HISTORY),
      selected: null,
    });
  },

  redo: () => {
    const s = get();
    const next = s.future[s.future.length - 1];
    if (!next) return;
    const snap: MapContentSnapshot = {
      name: s.name,
      width: s.width,
      height: s.height,
      tileSize: s.tileSize,
      tilesets: s.tilesets,
      layers: s.layers,
      objects: s.objects,
      areas: s.areas,
    };
    set({
      ...next,
      activeLayerId: next.layers.some((l) => l.id === s.activeLayerId) ? s.activeLayerId : next.layers[0].id,
      future: s.future.slice(0, -1),
      past: [...s.past, snap].slice(-MAX_HISTORY),
      selected: null,
    });
  },

  setName: (name) => set({ name }),

  resizeMap: (newWidth, newHeight) => {
    get().checkpoint();
    const { width, height, layers, objects, areas } = get();
    const w = Math.max(1, Math.round(newWidth));
    const h = Math.max(1, Math.round(newHeight));
    const resizedLayers = layers.map((layer) => {
      const next: (TerrainCellRef | null)[] = new Array(w * h).fill(null);
      for (let y = 0; y < Math.min(height, h); y++) {
        for (let x = 0; x < Math.min(width, w); x++) {
          next[y * w + x] = layer.cells[y * width + x] ?? null;
        }
      }
      return { ...layer, cells: next };
    });
    set({
      width: w,
      height: h,
      layers: resizedLayers,
      objects: objects.map((o) => ({ ...o, x: clamp(o.x, 0, Math.max(0, w - 1)), y: clamp(o.y, 0, Math.max(0, h - 1)) })),
      areas: areas.map((a) => ({
        ...a,
        x: clamp(a.x, 0, Math.max(0, w - 1)),
        y: clamp(a.y, 0, Math.max(0, h - 1)),
        width: clamp(a.width, 1, w - clamp(a.x, 0, Math.max(0, w - 1))),
        height: clamp(a.height, 1, h - clamp(a.y, 0, Math.max(0, h - 1))),
      })),
    });
  },

  setTileSize: (tileSize) => set({ tileSize: Math.max(4, Math.round(tileSize)) }),

  importTileset: async (file, tileWidth, tileHeight, marginX, marginY, spacingX, spacingY) => {
    get().checkpoint();
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);
    const columns = Math.max(1, Math.floor((img.width - marginX + spacingX) / (tileWidth + spacingX)));
    const rows = Math.max(1, Math.floor((img.height - marginY + spacingY) / (tileHeight + spacingY)));
    const tileset: TilesetDef = {
      id: makeId("tileset"),
      name: file.name.replace(/\.[^/.]+$/, ""),
      imageDataUrl: dataUrl,
      tileWidth,
      tileHeight,
      marginX,
      marginY,
      spacingX,
      spacingY,
      columns,
      rows,
      animations: {},
    };
    set({
      tilesets: [...get().tilesets, tileset],
      activeStamp: { tilesetId: tileset.id, width: 1, height: 1, tiles: [0] },
      activeTool: "terrain",
    });
  },

  removeTileset: (id) => {
    get().checkpoint();
    const { tilesets, layers, activeStamp } = get();
    set({
      tilesets: tilesets.filter((t) => t.id !== id),
      layers: layers.map((layer) => ({ ...layer, cells: layer.cells.map((cell) => (cell?.tilesetId === id ? null : cell)) })),
      activeStamp: activeStamp?.tilesetId === id ? null : activeStamp,
    });
  },

  setTileAnimationFrames: (tilesetId, baseTileIndex, frames) => {
    get().setTileAnimationFramesForMany(tilesetId, [{ baseTileIndex, frames }]);
  },

  setTileAnimationFramesForMany: (tilesetId, entries) => {
    get().checkpoint();
    set({
      tilesets: get().tilesets.map((ts) => {
        if (ts.id !== tilesetId) return ts;
        const nextAnimations = { ...ts.animations };
        for (const { baseTileIndex, frames } of entries) {
          if (frames.length === 0) delete nextAnimations[baseTileIndex];
          else nextAnimations[baseTileIndex] = frames;
        }
        return { ...ts, animations: nextAnimations };
      }),
    });
  },

  addLayer: () => {
    get().checkpoint();
    const { layers, width, height } = get();
    const layer: TerrainLayer = {
      id: makeId("layer"),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      cells: new Array(width * height).fill(null),
    };
    set({ layers: [...layers, layer], activeLayerId: layer.id });
  },

  removeLayer: (id) => {
    const { layers, activeLayerId } = get();
    if (layers.length <= 1) return; // luôn giữ ít nhất 1 layer
    get().checkpoint();
    const nextLayers = layers.filter((l) => l.id !== id);
    set({
      layers: nextLayers,
      activeLayerId: activeLayerId === id ? nextLayers[nextLayers.length - 1].id : activeLayerId,
    });
  },

  renameLayer: (id, name) => {
    get().checkpoint();
    set({ layers: get().layers.map((l) => (l.id === id ? { ...l, name } : l)) });
  },

  toggleLayerVisibility: (id) => {
    set({ layers: get().layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)) });
  },

  moveLayerUp: (id) => {
    const { layers } = get();
    const i = layers.findIndex((l) => l.id === id);
    if (i === -1 || i === layers.length - 1) return;
    get().checkpoint();
    const next = layers.slice();
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    set({ layers: next });
  },

  moveLayerDown: (id) => {
    const { layers } = get();
    const i = layers.findIndex((l) => l.id === id);
    if (i <= 0) return;
    get().checkpoint();
    const next = layers.slice();
    [next[i], next[i - 1]] = [next[i - 1], next[i]];
    set({ layers: next });
  },

  setActiveLayer: (id) => set({ activeLayerId: id }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setActiveStamp: (stamp) => set({ activeStamp: stamp, activeTool: "terrain" }),

  setEraserSize: (n) => set({ eraserSize: n }),

  paintCell: (cx, cy) => {
    const { activeStamp, width, height, layers, activeLayerId } = get();
    if (!activeStamp) return;
    const layerIndex = layers.findIndex((l) => l.id === activeLayerId);
    if (layerIndex === -1) return;
    const cells = layers[layerIndex].cells.slice();
    for (let dy = 0; dy < activeStamp.height; dy++) {
      for (let dx = 0; dx < activeStamp.width; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const tileIndex = activeStamp.tiles[dy * activeStamp.width + dx];
        cells[y * width + x] = { tilesetId: activeStamp.tilesetId, tileIndex };
      }
    }
    const nextLayers = layers.slice();
    nextLayers[layerIndex] = { ...layers[layerIndex], cells };
    set({ layers: nextLayers });
  },

  eraseCell: (cx, cy) => {
    const { eraserSize, width, height, layers, activeLayerId } = get();
    const layerIndex = layers.findIndex((l) => l.id === activeLayerId);
    if (layerIndex === -1) return;
    const cells = layers[layerIndex].cells.slice();
    const half = Math.floor(eraserSize / 2);
    for (let dy = 0; dy < eraserSize; dy++) {
      for (let dx = 0; dx < eraserSize; dx++) {
        const x = cx - half + dx;
        const y = cy - half + dy;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        cells[y * width + x] = null;
      }
    }
    const nextLayers = layers.slice();
    nextLayers[layerIndex] = { ...layers[layerIndex], cells };
    set({ layers: nextLayers });
  },

  fillLayer: () => {
    const { activeStamp, width, height, layers, activeLayerId } = get();
    if (!activeStamp) return;
    const layerIndex = layers.findIndex((l) => l.id === activeLayerId);
    if (layerIndex === -1) return;
    get().checkpoint();
    const cells: (TerrainCellRef | null)[] = new Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileIndex = activeStamp.tiles[(y % activeStamp.height) * activeStamp.width + (x % activeStamp.width)];
        cells[y * width + x] = { tilesetId: activeStamp.tilesetId, tileIndex };
      }
    }
    const nextLayers = layers.slice();
    nextLayers[layerIndex] = { ...layers[layerIndex], cells };
    set({ layers: nextLayers });
  },

  placeObject: (defType, x, y) => {
    const def = getMapObjectDefinition(defType);
    if (!def) return;
    get().checkpoint();
    const { width, height, objects } = get();
    const cx = clamp(x, 0, Math.max(0, width - def.footprintWidth));
    const cy = clamp(y, 0, Math.max(0, height - def.footprintHeight));
    const values: Record<string, FieldValue> = {};
    for (const field of def.fields) values[field.key] = field.default;
    const obj: MapObject = { id: makeId(def.type), kind: def.kind, defType: def.type, x: cx, y: cy, values };
    set({
      objects: [...objects, obj],
      selected: { type: "object", id: obj.id },
      pendingPlacement: null,
      activeTool: "select",
    });
  },

  moveObject: (id, x, y) => {
    get().checkpoint();
    get().positionObject(id, x, y);
  },

  positionObject: (id, x, y) => {
    const { objects, width, height } = get();
    set({
      objects: objects.map((o) => {
        if (o.id !== id) return o;
        const def = getMapObjectDefinition(o.defType);
        const fw = def?.footprintWidth ?? 1;
        const fh = def?.footprintHeight ?? 1;
        return { ...o, x: clamp(x, 0, Math.max(0, width - fw)), y: clamp(y, 0, Math.max(0, height - fh)) };
      }),
    });
  },

  updateObjectField: (id, key, value) => {
    get().checkpoint();
    set({
      objects: get().objects.map((o) => (o.id === id ? { ...o, values: { ...o.values, [key]: value } } : o)),
    });
  },

  removeObject: (id) => {
    get().checkpoint();
    set({
      objects: get().objects.filter((o) => o.id !== id),
      selected: get().selected?.type === "object" && get().selected?.id === id ? null : get().selected,
    });
  },

  addArea: (kind, x, y, w, h) => {
    get().checkpoint();
    const { width, height, areas } = get();
    const nx = clamp(x, 0, Math.max(0, width - 1));
    const ny = clamp(y, 0, Math.max(0, height - 1));
    const nw = clamp(w, 1, width - nx);
    const nh = clamp(h, 1, height - ny);
    const label = kind === "spawn" ? "Spawn" : kind === "trigger" ? "Trigger" : "Boundary";
    const count = areas.filter((a) => a.kind === kind).length + 1;
    const area: MapArea = { id: makeId("area"), kind, name: `${label} ${count}`, team: "", x: nx, y: ny, width: nw, height: nh };
    set({ areas: [...areas, area], selected: { type: "area", id: area.id }, activeTool: "select" });
  },

  updateArea: (id, patch) => {
    get().checkpoint();
    const { areas, width, height } = get();
    set({
      areas: areas.map((a) => {
        if (a.id !== id) return a;
        const merged = { ...a, ...patch };
        const nx = clamp(merged.x, 0, Math.max(0, width - 1));
        const ny = clamp(merged.y, 0, Math.max(0, height - 1));
        return {
          ...merged,
          x: nx,
          y: ny,
          width: clamp(merged.width, 1, width - nx),
          height: clamp(merged.height, 1, height - ny),
        };
      }),
    });
  },

  removeArea: (id) => {
    get().checkpoint();
    set({
      areas: get().areas.filter((a) => a.id !== id),
      selected: get().selected?.type === "area" && get().selected?.id === id ? null : get().selected,
    });
  },

  select: (selection) => set({ selected: selection }),

  removeSelected: () => {
    const { selected } = get();
    if (!selected) return;
    if (selected.type === "object") get().removeObject(selected.id);
    else get().removeArea(selected.id);
  },

  exportDocument: () => {
    const { name, width, height, tileSize, tilesets, layers, objects, areas } = get();
    return serializeMap({ name, width, height, tileSize, tilesets, layers, objects, areas });
  },

  loadDocument: (doc) => {
    if (!isMapDocument(doc)) {
      set({ lastLoadWarnings: ["File không đúng định dạng MapDocument — đã huỷ load."] });
      return;
    }
    const result = deserializeMap(doc);
    set({
      name: result.name,
      width: result.width,
      height: result.height,
      tileSize: result.tileSize,
      tilesets: result.tilesets,
      layers: result.layers,
      activeLayerId: result.layers[0].id,
      objects: result.objects,
      areas: result.areas,
      selected: null,
      activeTool: "select",
      activeStamp: null,
      pendingPlacement: null,
      lastLoadWarnings: result.warnings,
      cloudId: null,
      past: [],
      future: [],
    });
  },

  newMap: () => {
    const doc = emptyMapDocument();
    set({
      name: doc.name,
      width: doc.width,
      height: doc.height,
      tileSize: doc.tileSize,
      tilesets: [],
      layers: doc.layers,
      activeLayerId: doc.layers[0].id,
      objects: [],
      areas: [],
      selected: null,
      activeTool: "select",
      activeStamp: null,
      pendingPlacement: null,
      lastLoadWarnings: [],
      cloudId: null,
      past: [],
      future: [],
    });
  },
}));
