import { useState } from "react";
import type { NodeDefinition } from "../../types/nodeDefs";
import { PaletteItem } from "./PaletteItem";

export function PaletteGroup({
  title,
  accentColor,
  items,
}: {
  title: string;
  accentColor: string;
  items: NodeDefinition[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="palette-group">
      <button className="palette-group__header" onClick={() => setOpen((v) => !v)}>
        <span className="palette-group__caret" data-open={open}>
          ▸
        </span>
        <span className="palette-group__dot" style={{ background: accentColor }} />
        <span>{title}</span>
        <span className="palette-group__count">{items.length}</span>
      </button>
      {open && (
        <div className="palette-group__items">
          {items.map((def) => (
            <PaletteItem key={def.type} def={def} />
          ))}
        </div>
      )}
    </div>
  );
}
