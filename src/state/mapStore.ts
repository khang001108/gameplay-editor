import { create } from "zustand";
import type { AreaKind, MapArea, MapDocument, MapObject, TerrainCellRef, TilesetDef } from "../types/map";
import type { FieldValue } from "../types/graph";
import { getMapObjectDefinition } from "../mapDefinitions";
import { makeId } from "../utils/id";
import { clamp } from "../utils/clamp";
import { readFileAsDataURL, loadImage } from "../utils/image";
import { serializeMap } from "../serialization/mapSerializer";
import { deserializeMap, isMapDocument } from "../serialization/mapDeserializer";
import { emptyMapDocument } from "../serialization/mapSchema";

export type MapTool = "select" | "terrain" | "erase" | "area-spawn" | "area-trigger" | "area-boundary";

export type MapSelection = { type: "object" | "area"; id: string } | null;

interface MapState {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tilesets: TilesetDef[];
  terrain: (TerrainCellRef | null)[];
  objects: MapObject[];
  areas: MapArea[];

  selected: MapSelection;
  activeTool: MapTool;
  activeTilesetId: string | null;
  activeTileIndex: number | null;
  brushSize: 1 | 2 | 3;
  lastLoadWarnings: string[];

  setName: (name: string) => void;
  resizeMap: (width: number, height: number) => void;
  setTileSize: (tileSize: number) => void;

  importTileset: (file: File, tileWidth: number, tileHeight: number) => Promise<void>;
  removeTileset: (id: string) => void;

  setActiveTool: (tool: MapTool) => void;
  setActiveTile: (tilesetId: string, tileIndex: number) => void;
  setBrushSize: (n: 1 | 2 | 3) => void;
  paintCell: (x: number, y: number) => void;
  eraseCell: (x: number, y: number) => void;

  placeObject: (defType: string, x: number, y: number) => void;
  moveObject: (id: string, x: number, y: number) => void;
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
  terrain: initialDoc.terrain,
  objects: [],
  areas: [],

  selected: null,
  activeTool: "select",
  activeTilesetId: null,
  activeTileIndex: null,
  brushSize: 1,
  lastLoadWarnings: [],

  setName: (name) => set({ name }),

  resizeMap: (newWidth, newHeight) => {
    const { width, height, terrain, objects, areas } = get();
    const w = Math.max(1, Math.round(newWidth));
    const h = Math.max(1, Math.round(newHeight));
    const next: (TerrainCellRef | null)[] = new Array(w * h).fill(null);
    for (let y = 0; y < Math.min(height, h); y++) {
      for (let x = 0; x < Math.min(width, w); x++) {
        next[y * w + x] = terrain[y * width + x] ?? null;
      }
    }
    set({
      width: w,
      height: h,
      terrain: next,
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

  importTileset: async (file, tileWidth, tileHeight) => {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);
    const columns = Math.max(1, Math.floor(img.width / tileWidth));
    const rows = Math.max(1, Math.floor(img.height / tileHeight));
    const tileset: TilesetDef = {
      id: makeId("tileset"),
      name: file.name.replace(/\.[^/.]+$/, ""),
      imageDataUrl: dataUrl,
      tileWidth,
      tileHeight,
      columns,
      rows,
    };
    set({
      tilesets: [...get().tilesets, tileset],
      activeTilesetId: tileset.id,
      activeTileIndex: 0,
      activeTool: "terrain",
    });
  },

  removeTileset: (id) => {
    const { tilesets, terrain, activeTilesetId } = get();
    set({
      tilesets: tilesets.filter((t) => t.id !== id),
      terrain: terrain.map((cell) => (cell?.tilesetId === id ? null : cell)),
      activeTilesetId: activeTilesetId === id ? null : activeTilesetId,
      activeTileIndex: activeTilesetId === id ? null : get().activeTileIndex,
    });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),

  setActiveTile: (tilesetId, tileIndex) => set({ activeTilesetId: tilesetId, activeTileIndex: tileIndex, activeTool: "terrain" }),

  setBrushSize: (n) => set({ brushSize: n }),

  paintCell: (cx, cy) => {
    const { activeTilesetId, activeTileIndex, brushSize, width, height, terrain } = get();
    if (activeTilesetId == null || activeTileIndex == null) return;
    const next = terrain.slice();
    const half = Math.floor(brushSize / 2);
    for (let dy = 0; dy < brushSize; dy++) {
      for (let dx = 0; dx < brushSize; dx++) {
        const x = cx - half + dx;
        const y = cy - half + dy;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        next[y * width + x] = { tilesetId: activeTilesetId, tileIndex: activeTileIndex };
      }
    }
    set({ terrain: next });
  },

  eraseCell: (cx, cy) => {
    const { brushSize, width, height, terrain } = get();
    const next = terrain.slice();
    const half = Math.floor(brushSize / 2);
    for (let dy = 0; dy < brushSize; dy++) {
      for (let dx = 0; dx < brushSize; dx++) {
        const x = cx - half + dx;
        const y = cy - half + dy;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        next[y * width + x] = null;
      }
    }
    set({ terrain: next });
  },

  placeObject: (defType, x, y) => {
    const def = getMapObjectDefinition(defType);
    if (!def) return;
    const { width, height, objects } = get();
    const cx = clamp(x, 0, Math.max(0, width - def.footprintWidth));
    const cy = clamp(y, 0, Math.max(0, height - def.footprintHeight));
    const values: Record<string, FieldValue> = {};
    for (const field of def.fields) values[field.key] = field.default;
    const obj: MapObject = { id: makeId(def.type), kind: def.kind, defType: def.type, x: cx, y: cy, values };
    set({ objects: [...objects, obj], selected: { type: "object", id: obj.id } });
  },

  moveObject: (id, x, y) => {
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
    set({
      objects: get().objects.map((o) => (o.id === id ? { ...o, values: { ...o.values, [key]: value } } : o)),
    });
  },

  removeObject: (id) => {
    set({
      objects: get().objects.filter((o) => o.id !== id),
      selected: get().selected?.type === "object" && get().selected?.id === id ? null : get().selected,
    });
  },

  addArea: (kind, x, y, w, h) => {
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
    const { name, width, height, tileSize, tilesets, terrain, objects, areas } = get();
    return serializeMap({ name, width, height, tileSize, tilesets, terrain, objects, areas });
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
      terrain: result.terrain,
      objects: result.objects,
      areas: result.areas,
      selected: null,
      activeTool: "select",
      activeTilesetId: null,
      activeTileIndex: null,
      lastLoadWarnings: result.warnings,
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
      terrain: doc.terrain,
      objects: [],
      areas: [],
      selected: null,
      activeTool: "select",
      activeTilesetId: null,
      activeTileIndex: null,
      lastLoadWarnings: [],
    });
  },
}));
