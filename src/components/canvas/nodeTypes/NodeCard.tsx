import { Handle, Position } from "@xyflow/react";
import type { NodeDefinition } from "../../../types/nodeDefs";
import type { GraphNodeData } from "../../../types/graph";

export function NodeCard({
  def,
  data,
  selected,
}: {
  def: NodeDefinition;
  data: GraphNodeData;
  selected: boolean;
}) {
  const previewFields = def.fields.slice(0, 3);

  return (
    <div className={`node-card${selected ? " node-card--selected" : ""}`} style={{ "--accent": def.color } as React.CSSProperties}>
      {def.inputs.map((inputName, i) => (
        <Handle
          key={inputName}
          id={inputName}
          type="target"
          position={Position.Left}
          style={{ top: def.inputs.length === 1 ? "50%" : `${((i + 1) / (def.inputs.length + 1)) * 100}%` }}
        />
      ))}

      <div className="node-card__header">
        <span className="node-card__category">{def.category}</span>
        <span className="node-card__label">{def.label}</span>
      </div>

      {previewFields.length > 0 && (
        <div className="node-card__body">
          {previewFields.map((f) => (
            <div key={f.key} className="node-card__field-preview">
              <span className="node-card__field-key">{f.label}</span>
              <span className="node-card__field-value">{String(data.values[f.key] ?? "")}</span>
            </div>
          ))}
          {def.fields.length > previewFields.length && (
            <div className="node-card__more">+{def.fields.length - previewFields.length} thuộc tính khác…</div>
          )}
        </div>
      )}

      {def.outputs.map((outputName, i) => {
        const topPct = `${((i + 1) / (def.outputs.length + 1)) * 100}%`;
        return (
          <div key={outputName}>
            {def.outputs.length > 1 && (
              <span className="node-card__output-label" style={{ top: topPct }}>
                {outputName}
              </span>
            )}
            <Handle id={outputName} type="source" position={Position.Right} style={{ top: topPct }} />
          </div>
        );
      })}
    </div>
  );
}
