import { Sidebar } from "../sidebar/Sidebar";
import { GraphCanvas } from "../canvas/GraphCanvas";
import { Inspector } from "../inspector/Inspector";
import { Drawer } from "../layout/Drawer";
import { useGraphStore } from "../../state/graphStore";

export function GameplayEditorShell() {
  const warnings = useGraphStore((s) => s.lastLoadWarnings);

  return (
    <>
      <Drawer side="sidebar">
        <Sidebar />
      </Drawer>
      <main className="app-shell__canvas">
        <GraphCanvas />
        {warnings.length > 0 && (
          <div className="load-warnings">
            {warnings.map((w, i) => (
              <div key={i}>⚠ {w}</div>
            ))}
          </div>
        )}
      </main>
      <Drawer side="inspector">
        <Inspector />
      </Drawer>
    </>
  );
}
