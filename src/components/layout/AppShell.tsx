import { useState } from "react";
import { TopBar } from "./TopBar";
import { GameplayEditorShell } from "../gameplayEditor/GameplayEditorShell";
import { MapEditorShell } from "../mapEditor/MapEditorShell";
import { useGraphStore } from "../../state/graphStore";
import { useMapStore } from "../../state/mapStore";
import type { EditorMode } from "../../state/editorMode";

export function AppShell() {
  const [mode, setMode] = useState<EditorMode>("map");

  const graphName = useGraphStore((s) => s.graphName);
  const setGraphName = useGraphStore((s) => s.setGraphName);
  const exportGraph = useGraphStore((s) => s.exportDocument);
  const loadGraph = useGraphStore((s) => s.loadDocument);
  const newGraph = useGraphStore((s) => s.newGraph);

  const mapName = useMapStore((s) => s.name);
  const setMapName = useMapStore((s) => s.setName);
  const exportMap = useMapStore((s) => s.exportDocument);
  const loadMap = useMapStore((s) => s.loadDocument);
  const newMap = useMapStore((s) => s.newMap);

  const topBarProps =
    mode === "map"
      ? { name: mapName, onNameChange: setMapName, onNew: newMap, onLoadJson: loadMap, exportData: exportMap, exportFilePrefix: "map" }
      : { name: graphName, onNameChange: setGraphName, onNew: newGraph, onLoadJson: loadGraph, exportData: exportGraph, exportFilePrefix: "gameplay_graph" };

  return (
    <div className="app-shell">
      <TopBar mode={mode} onModeChange={setMode} {...topBarProps} />
      <div className="app-shell__body">
        {mode === "map" && <MapEditorShell />}
        {mode === "gameplay" && <GameplayEditorShell />}
      </div>
    </div>
  );
}
