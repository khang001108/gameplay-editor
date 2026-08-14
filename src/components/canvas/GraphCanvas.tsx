import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import { useGraphStore } from "../../state/graphStore";
import { useThemeStore } from "../../state/themeStore";
import type { GraphNodeData } from "../../types/graph";
import { nodeTypes } from "./nodeTypes";
import { getNodeDefinition } from "../../nodeDefinitions";

function GraphCanvasInner() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const addNodeFromPalette = useGraphStore((s) => s.addNodeFromPalette);
  const selectNode = useGraphStore((s) => s.selectNode);
  const checkpoint = useGraphStore((s) => s.checkpoint);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const pendingNodeType = useGraphStore((s) => s.pendingNodeType);
  const cancelNodePlacement = useGraphStore((s) => s.cancelNodePlacement);
  const theme = useThemeStore((s) => s.theme);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (e.key === "Escape") cancelNodePlacement();
      if (isTyping) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo, cancelNodePlacement]);

  const handlePaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (!pendingNodeType || !getNodeDefinition(pendingNodeType)) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNodeFromPalette(pendingNodeType, position);
    },
    [pendingNodeType, addNodeFromPalette, screenToFlowPosition]
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: Node<GraphNodeData>[] }) => {
      selectNode(selected.length === 1 ? selected[0].id : null);
    },
    [selectNode]
  );

  return (
    <div className="graph-canvas">
      {pendingNodeType && (
        <div className="graph-canvas__hint">
          <span>Chạm/click vào canvas để đặt node</span>
          <button className="btn btn--sm" onClick={cancelNodePlacement}>
            Huỷ (Esc)
          </button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        onNodeDragStart={() => checkpoint()}
        onPaneClick={handlePaneClick}
        isValidConnection={(c) => c.source !== c.target}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color={theme === "light" ? "#d8cdb0" : "#3a3226"} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.data as GraphNodeData)?.category === "event" ? "#5b8dbe" : (n.data as GraphNodeData)?.category === "condition" ? "#d4a94e" : "#6b9c5f"}
        />
      </ReactFlow>
    </div>
  );
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  );
}
