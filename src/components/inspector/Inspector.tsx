import { useGraphStore } from "../../state/graphStore";
import { getNodeDefinition, CATEGORY_LABEL } from "../../nodeDefinitions";
import { TextField } from "./fields/TextField";
import { NumberField } from "./fields/NumberField";
import { SelectField } from "./fields/SelectField";
import { BooleanField } from "./fields/BooleanField";
import type { FieldValue } from "../../types/graph";

export function Inspector() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const updateNodeField = useGraphStore((s) => s.updateNodeField);
  const removeNode = useGraphStore((s) => s.removeNode);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <aside className="inspector">
        <div className="inspector__empty">Chọn 1 node trên canvas để chỉnh thuộc tính.</div>
      </aside>
    );
  }

  const def = getNodeDefinition(node.data.defType);
  if (!def) {
    return (
      <aside className="inspector">
        <div className="inspector__empty">Không rõ loại node này (định nghĩa đã bị xoá khỏi registry).</div>
      </aside>
    );
  }

  const handleChange = (key: string, value: FieldValue) => updateNodeField(node.id, key, value);

  return (
    <aside className="inspector" style={{ "--accent": def.color } as React.CSSProperties}>
      <div className="inspector__header">
        <span className="inspector__category">{CATEGORY_LABEL[def.category]}</span>
        <h2 className="inspector__title">{def.label}</h2>
        <p className="inspector__desc">{def.description}</p>
      </div>

      <div className="inspector__meta">
        <span>ID</span>
        <code>{node.id}</code>
      </div>

      <div className="inspector__fields">
        {def.fields.length === 0 && <div className="inspector__empty inspector__empty--inline">Node này không có thuộc tính nào.</div>}
        {def.fields.map((field) => {
          const value = node.data.values[field.key];
          return (
            <div className="field-row" key={field.key}>
              <label className="field-row__label">{field.label}</label>
              {field.kind === "text" && (
                <TextField field={field} value={String(value ?? "")} onChange={(v) => handleChange(field.key, v)} />
              )}
              {field.kind === "number" && (
                <NumberField field={field} value={Number(value ?? 0)} onChange={(v) => handleChange(field.key, v)} />
              )}
              {field.kind === "select" && (
                <SelectField field={field} value={String(value ?? "")} onChange={(v) => handleChange(field.key, v)} />
              )}
              {field.kind === "boolean" && (
                <BooleanField value={Boolean(value)} onChange={(v) => handleChange(field.key, v)} />
              )}
              {field.helpText && <p className="field-row__help">{field.helpText}</p>}
            </div>
          );
        })}
      </div>

      <button className="btn btn--danger" onClick={() => removeNode(node.id)}>
        Xoá node
      </button>
    </aside>
  );
}
