export function BooleanField({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="field-toggle">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{value ? "Bật" : "Tắt"}</span>
    </label>
  );
}
