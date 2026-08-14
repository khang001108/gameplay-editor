import type { NodeDefinition } from "../../types/nodeDefs";
import { useGraphStore } from "../../state/graphStore";
import { useUiStore } from "../../state/uiStore";

export function PaletteItem({ def }: { def: NodeDefinition }) {
  const isArmed = useGraphStore((s) => s.pendingNodeType === def.type);
  const armNodePlacement = useGraphStore((s) => s.armNodePlacement);
  const cancelNodePlacement = useGraphStore((s) => s.cancelNodePlacement);
  const closeDrawers = useUiStore((s) => s.closeDrawers);

  return (
    <button
      type="button"
      className={`palette-item${isArmed ? " palette-item--armed" : ""}`}
      onClick={() => {
        if (isArmed) cancelNodePlacement();
        else {
          armNodePlacement(def.type);
          closeDrawers();
        }
      }}
      title={def.description}
      style={{ "--accent": def.color } as React.CSSProperties}
    >
      <span className="palette-item__dot" />
      <span className="palette-item__label">{def.label}</span>
    </button>
  );
}
