import type { FieldDefinition } from "../../../types/nodeDefs";

export function NumberField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      className="field-input"
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={field.min}
      max={field.max}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
    />
  );
}
