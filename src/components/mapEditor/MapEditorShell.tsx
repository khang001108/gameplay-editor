import { MapSidebar } from "./sidebar/MapSidebar";
import { MapCanvas } from "./canvas/MapCanvas";
import { MapInspector } from "./inspector/MapInspector";
import { Drawer } from "../layout/Drawer";
import { useMapStore } from "../../state/mapStore";

export function MapEditorShell() {
  const warnings = useMapStore((s) => s.lastLoadWarnings);

  return (
    <>
      <Drawer side="sidebar">
        <MapSidebar />
      </Drawer>
      <main className="app-shell__canvas">
        <MapCanvas />
        {warnings.length > 0 && (
          <div className="load-warnings">
            {warnings.map((w, i) => (
              <div key={i}>⚠ {w}</div>
            ))}
          </div>
        )}
      </main>
      <Drawer side="inspector">
        <MapInspector />
      </Drawer>
    </>
  );
}
