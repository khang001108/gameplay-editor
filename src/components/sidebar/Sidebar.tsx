import { getNodeDefinitionsByCategory } from "../../nodeDefinitions";
import { PaletteGroup } from "./PaletteGroup";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__hint">Kéo 1 node vào canvas để thêm</div>
      <PaletteGroup title="Event" accentColor="#5b8dbe" items={getNodeDefinitionsByCategory("event")} />
      <PaletteGroup title="Condition" accentColor="#d4a94e" items={getNodeDefinitionsByCategory("condition")} />
      <PaletteGroup title="Action" accentColor="#6b9c5f" items={getNodeDefinitionsByCategory("action")} />
    </aside>
  );
}
