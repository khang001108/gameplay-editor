import type { NodeCategory, FieldValue } from "./graph";

export type { NodeCategory };

export type FieldKind = "text" | "number" | "select" | "boolean";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  kind: FieldKind;
  default: FieldValue;
  /** chỉ dùng khi kind = "select" */
  options?: SelectOption[];
  min?: number;
  max?: number;
  placeholder?: string;
  /** ghi chú ngắn hiện dưới field trong Inspector, giúp người dùng hiểu ý nghĩa property */
  helpText?: string;
}

export interface NodeDefinition {
  /** id duy nhất, dùng làm GraphNodeData.defType và làm "type" khi xuất JSON runtime */
  type: string;
  category: NodeCategory;
  label: string;
  /** mô tả ngắn hiện trong Sidebar khi hover */
  description: string;
  /** màu accent riêng của node — Sidebar/Canvas dùng chung, không hard-code lại */
  color: string;
  /** tên các input pin (Event luôn rỗng — không có input) */
  inputs: string[];
  /** tên các output pin (Condition có "true"/"false", Event/Action có "out") */
  outputs: string[];
  fields: FieldDefinition[];
}
