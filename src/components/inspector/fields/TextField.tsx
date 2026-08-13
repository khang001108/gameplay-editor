import type { FieldDefinition } from "../../../types/nodeDefs";

export function TextField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      className="field-input"
      type="text"
      value={value}
      placeholder={field.placeholder}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
