import type { GraphDocument } from "./graph";
import type { MapDocument } from "./map";

export type CloudDocType = "map" | "gameplay";

/** 1 dòng trong bảng `documents` trên Supabase — xem SUPABASE_SETUP.md để tạo bảng */
export interface CloudDocumentRow {
  id: string;
  owner: string;
  type: CloudDocType;
  name: string;
  data: MapDocument | GraphDocument;
  updated_at: string;
}

/** dùng cho danh sách "Mở từ Cloud" — không cần tải cả `data` nặng, chỉ liệt kê tên + thời gian */
export interface CloudDocumentSummary {
  id: string;
  name: string;
  updated_at: string;
}
