import { useState } from "react";
import { TerrainPanel } from "./TerrainPanel";
import { ObjectPalette } from "./ObjectPalette";
import { AreaPanel } from "./AreaPanel";

type SidebarTab = "terrain" | "buildings" | "units" | "areas";

const TABS: { id: SidebarTab; label: string }[] = [
  { id: "terrain", label: "Terrain" },
  { id: "buildings", label: "Buildings" },
  { id: "units", label: "Units" },
  { id: "areas", label: "Spawn/Area" },
];

export function MapSidebar() {
  const [tab, setTab] = useState<SidebarTab>("terrain");

  return (
    <aside className="sidebar map-sidebar">
      <div className="map-sidebar__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`map-sidebar__tab${tab === t.id ? " map-sidebar__tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "terrain" && <TerrainPanel />}
      {tab === "buildings" && <ObjectPalette kind="building" />}
      {tab === "units" && <ObjectPalette kind="unit" />}
      {tab === "areas" && <AreaPanel />}
    </aside>
  );
}
