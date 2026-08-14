import { useEffect, useRef, useState } from "react";
import { TopBar } from "./TopBar";
import { GameplayEditorShell } from "../gameplayEditor/GameplayEditorShell";
import { MapEditorShell } from "../mapEditor/MapEditorShell";
import { useGraphStore } from "../../state/graphStore";
import { useMapStore } from "../../state/mapStore";
import { useAuthStore } from "../../state/authStore";
import { useUiStore } from "../../state/uiStore";
import { saveCloudDocument } from "../../lib/cloudApi";
import type { EditorMode } from "../../state/editorMode";
import type { CloudDocumentRow } from "../../types/cloud";

const AUTOSAVE_DEBOUNCE_MS = 4000;

export function AppShell() {
  const [mode, setMode] = useState<EditorMode>("map");
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const inspectorOpen = useUiStore((s) => s.inspectorOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);

  const handleModeChange = (next: EditorMode) => {
    setMode(next);
    closeDrawers();
  };

  const graphName = useGraphStore((s) => s.graphName);
  const setGraphName = useGraphStore((s) => s.setGraphName);
  const exportGraph = useGraphStore((s) => s.exportDocument);
  const loadGraph = useGraphStore((s) => s.loadDocument);
  const newGraph = useGraphStore((s) => s.newGraph);
  const graphCanUndo = useGraphStore((s) => s.past.length > 0);
  const graphCanRedo = useGraphStore((s) => s.future.length > 0);
  const graphUndo = useGraphStore((s) => s.undo);
  const graphRedo = useGraphStore((s) => s.redo);

  const graphCloudId = useGraphStore((s) => s.cloudId);
  const setGraphCloudId = useGraphStore((s) => s.setCloudId);

  const mapName = useMapStore((s) => s.name);
  const setMapName = useMapStore((s) => s.setName);
  const exportMap = useMapStore((s) => s.exportDocument);
  const loadMap = useMapStore((s) => s.loadDocument);
  const newMap = useMapStore((s) => s.newMap);
  const mapCanUndo = useMapStore((s) => s.past.length > 0);
  const mapCanRedo = useMapStore((s) => s.future.length > 0);
  const mapUndo = useMapStore((s) => s.undo);
  const mapRedo = useMapStore((s) => s.redo);
  const mapCloudId = useMapStore((s) => s.cloudId);
  const setMapCloudId = useMapStore((s) => s.setCloudId);
  const mapTerrain = useMapStore((s) => s.terrain);
  const mapObjects = useMapStore((s) => s.objects);
  const mapAreas = useMapStore((s) => s.areas);
  const mapTilesets = useMapStore((s) => s.tilesets);
  const mapWidth = useMapStore((s) => s.width);
  const mapHeight = useMapStore((s) => s.height);
  const mapTileSize = useMapStore((s) => s.tileSize);

  const graphNodes = useGraphStore((s) => s.nodes);
  const graphEdges = useGraphStore((s) => s.edges);

  const user = useAuthStore((s) => s.user);

  const handleGraphCloudLoaded = (row: CloudDocumentRow) => {
    loadGraph(row.data);
    setGraphCloudId(row.id);
  };
  const handleMapCloudLoaded = (row: CloudDocumentRow) => {
    loadMap(row.data);
    setMapCloudId(row.id);
  };

  // Autosave lên Cloud: chỉ chạy khi đã đăng nhập VÀ document đã từng "Lưu Cloud" thủ công 1 lần
  // (có cloudId) — chờ người dùng ngừng sửa 4s rồi mới lưu, tránh gọi API liên tục lúc đang gõ/vẽ.
  const mapAutosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user || !mapCloudId) return;
    if (mapAutosaveTimer.current) clearTimeout(mapAutosaveTimer.current);
    mapAutosaveTimer.current = setTimeout(() => {
      saveCloudDocument({ id: mapCloudId, type: "map", name: mapName, data: exportMap() }).then(setMapCloudId).catch(() => {});
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (mapAutosaveTimer.current) clearTimeout(mapAutosaveTimer.current);
    };
  }, [user, mapCloudId, mapName, mapTerrain, mapObjects, mapAreas, mapTilesets, mapWidth, mapHeight, mapTileSize, exportMap, setMapCloudId]);

  const graphAutosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user || !graphCloudId) return;
    if (graphAutosaveTimer.current) clearTimeout(graphAutosaveTimer.current);
    graphAutosaveTimer.current = setTimeout(() => {
      saveCloudDocument({ id: graphCloudId, type: "gameplay", name: graphName, data: exportGraph() })
        .then(setGraphCloudId)
        .catch(() => {});
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (graphAutosaveTimer.current) clearTimeout(graphAutosaveTimer.current);
    };
  }, [user, graphCloudId, graphName, graphNodes, graphEdges, exportGraph, setGraphCloudId]);

  const topBarProps =
    mode === "map"
      ? {
          name: mapName,
          onNameChange: setMapName,
          onNew: newMap,
          onLoadJson: loadMap,
          exportData: exportMap,
          exportFilePrefix: "map",
          canUndo: mapCanUndo,
          canRedo: mapCanRedo,
          onUndo: mapUndo,
          onRedo: mapRedo,
          cloudDocType: "map" as const,
          cloudId: mapCloudId,
          onCloudSaved: setMapCloudId,
          onCloudLoaded: handleMapCloudLoaded,
        }
      : {
          name: graphName,
          onNameChange: setGraphName,
          onNew: newGraph,
          onLoadJson: loadGraph,
          exportData: exportGraph,
          exportFilePrefix: "gameplay_graph",
          canUndo: graphCanUndo,
          canRedo: graphCanRedo,
          onUndo: graphUndo,
          onRedo: graphRedo,
          cloudDocType: "gameplay" as const,
          cloudId: graphCloudId,
          onCloudSaved: setGraphCloudId,
          onCloudLoaded: handleGraphCloudLoaded,
        };

  return (
    <div className="app-shell">
      <TopBar mode={mode} onModeChange={handleModeChange} {...topBarProps} />
      <div className="app-shell__body">
        {(sidebarOpen || inspectorOpen) && <div className="drawer-backdrop" onClick={closeDrawers} />}
        {mode === "map" && <MapEditorShell />}
        {mode === "gameplay" && <GameplayEditorShell />}
      </div>
    </div>
  );
}
