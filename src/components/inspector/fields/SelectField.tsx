import type { FieldDefinition } from "../../../types/nodeDefs";

export function SelectField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {(field.options ?? []).map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
