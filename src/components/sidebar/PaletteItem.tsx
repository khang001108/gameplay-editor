import type { NodeDefinition } from "../../types/nodeDefs";

/** key MIME riêng cho drag từ sidebar — GraphCanvas đọc lại đúng key này khi onDrop */
export const PALETTE_DRAG_MIME = "application/gameplay-node-type";

export function PaletteItem({ def }: { def: NodeDefinition }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(PALETTE_DRAG_MIME, def.type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="palette-item" draggable onDragStart={handleDragStart} title={def.description} style={{ "--accent": def.color } as React.CSSProperties}>
      <span className="palette-item__dot" />
      <span className="palette-item__label">{def.label}</span>
    </div>
  );
}
