/** key MIME riêng cho kéo 1 building/unit mới từ sidebar — value = defType */
export const NEW_MAP_OBJECT_MIME = "application/map-new-object";

/** key MIME riêng cho kéo di chuyển 1 object đã có trên canvas — value = JSON {id, offsetX, offsetY} */
export const MOVE_MAP_OBJECT_MIME = "application/map-move-object";

export interface MoveObjectPayload {
  id: string;
  offsetX: number;
  offsetY: number;
}
