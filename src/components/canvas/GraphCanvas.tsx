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
import type { GraphNodeData } from "../../types/graph";
import { nodeTypes } from "./nodeTypes";
import { PALETTE_DRAG_MIME } from "../sidebar/PaletteItem";
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
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
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
  }, [undo, redo]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const defType = e.dataTransfer.getData(PALETTE_DRAG_MIME);
      if (!defType || !getNodeDefinition(defType)) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNodeFromPalette(defType, position);
    },
    [addNodeFromPalette, screenToFlowPosition]
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: Node<GraphNodeData>[] }) => {
      selectNode(selected.length === 1 ? selected[0].id : null);
    },
    [selectNode]
  );

  return (
    <div className="graph-canvas" onDragOver={handleDragOver} onDrop={handleDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        onNodeDragStart={() => checkpoint()}
        isValidConnection={(c) => c.source !== c.target}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#3a3226" />
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
