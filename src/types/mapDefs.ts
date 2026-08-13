import type { FieldDefinition } from "./nodeDefs";

export type MapObjectKind = "building" | "unit";

export interface MapObjectDefinition {
  /** id duy nhất, dùng làm MapObject.defType và làm "type" khi xuất JSON runtime */
  type: string;
  kind: MapObjectKind;
  label: string;
  /** mô tả ngắn hiện trong Sidebar khi hover */
  description: string;
  /** màu accent riêng — Sidebar/Canvas dùng chung, không hard-code lại */
  color: string;
  /** kích thước chiếm trên lưới, tính theo số ô (tile) */
  footprintWidth: number;
  footprintHeight: number;
  fields: FieldDefinition[];
}
