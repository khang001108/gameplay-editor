import { Sidebar } from "../sidebar/Sidebar";
import { GraphCanvas } from "../canvas/GraphCanvas";
import { Inspector } from "../inspector/Inspector";
import { useGraphStore } from "../../state/graphStore";

export function GameplayEditorShell() {
  const warnings = useGraphStore((s) => s.lastLoadWarnings);

  return (
    <>
      <Sidebar />
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
      <Inspector />
    </>
  );
}
