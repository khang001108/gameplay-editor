import { useEffect, useSyncExternalStore } from "react";
import type { TilesetDef } from "../../types/map";

type LoadState = "loading" | "loaded" | "error";
interface CacheEntry {
  img: HTMLImageElement;
  state: LoadState;
}

// cache module-level (KHÔNG phải state trong component) — dùng chung thật sự giữa mọi nơi gọi hook
// này (sidebar lẫn canvas), nên 1 ảnh chỉ tải/giải mã đúng 1 lần dù nhiều component cùng cần tới.
const cache = new Map<string, CacheEntry>();
const listeners = new Set<() => void>();
let version = 0;

function emitChange() {
  version++;
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getVersion() {
  return version;
}

/** Bắt đầu tải 1 ảnh nếu chưa từng tải — gọi nhiều lần với cùng id là an toàn (no-op nếu đã có). */
function ensureLoading(id: string, url: string) {
  if (cache.has(id)) return;
  const img = new Image();
  // ảnh có thể là URL Supabase Storage (sau khi lưu Cloud) thay vì data: URL cục bộ — cần
  // crossOrigin để canvas không bị "tainted" nếu sau này có tính năng đọc lại pixel/export.
  img.crossOrigin = "anonymous";
  cache.set(id, { img, state: "loading" });
  img.onload = () => {
    const entry = cache.get(id);
    if (entry) entry.state = "loaded";
    emitChange();
  };
  img.onerror = () => {
    const entry = cache.get(id);
    if (entry) entry.state = "error";
    emitChange();
  };
  img.src = url;
}

function evictRemoved(validIds: Set<string>) {
  let changed = false;
  for (const id of Array.from(cache.keys())) {
    if (!validIds.has(id)) {
      cache.delete(id);
      changed = true;
    }
  }
  if (changed) emitChange();
}

/** Tải ảnh tileset THEO YÊU CẦU — không tự tải hết mọi tileset đã import ngay khi mở map (map lưu
 * Cloud có thể có cả chục/trăm tileset từ lúc import cả folder, tải hết 1 lúc là nguyên nhân lag).
 * `activeIds`: tileset nào ĐANG CẦN hiện ngay bây giờ (map đang thật sự dùng trên canvas, hoặc
 * folder trong sidebar đang mở) — chỉ những cái này mới bắt đầu tải; còn lại giữ nguyên "chưa tải"
 * cho tới khi được yêu cầu (mở đúng folder chứa nó). Cache dùng chung nên đã tải ở nơi này (vd canvas)
 * thì nơi khác (vd sidebar) dùng lại ngay, không tải/giải mã lại lần 2. */
export function useTilesetImages(
  tilesets: TilesetDef[],
  activeIds: ReadonlySet<string>
): { images: Map<string, HTMLImageElement>; isLoading: (id: string) => boolean } {
  useSyncExternalStore(subscribe, getVersion, getVersion);

  useEffect(() => {
    evictRemoved(new Set(tilesets.map((t) => t.id)));
  }, [tilesets]);

  useEffect(() => {
    for (const ts of tilesets) {
      if (activeIds.has(ts.id)) ensureLoading(ts.id, ts.imageDataUrl);
    }
  }, [tilesets, activeIds]);

  const images = new Map<string, HTMLImageElement>();
  for (const ts of tilesets) {
    const entry = cache.get(ts.id);
    if (entry) images.set(ts.id, entry.img);
  }

  return {
    images,
    isLoading: (id: string) => cache.get(id)?.state === "loading",
  };
}
