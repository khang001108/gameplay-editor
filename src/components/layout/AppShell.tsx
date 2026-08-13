import { TopBar } from "./TopBar";
import { Sidebar } from "../sidebar/Sidebar";
import { GraphCanvas } from "../canvas/GraphCanvas";
import { Inspector } from "../inspector/Inspector";
import { useGraphStore } from "../../state/graphStore";

export function AppShell() {
  const warnings = useGraphStore((s) => s.lastLoadWarnings);

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-shell__body">
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
      </div>
    </div>
  );
}
