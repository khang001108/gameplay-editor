import { useRef } from "react";
import { useGraphStore } from "../../state/graphStore";
import { downloadJson } from "../../utils/download";

export function TopBar() {
  const graphName = useGraphStore((s) => s.graphName);
  const setGraphName = useGraphStore((s) => s.setGraphName);
  const exportDocument = useGraphStore((s) => s.exportDocument);
  const loadDocument = useGraphStore((s) => s.loadDocument);
  const newGraph = useGraphStore((s) => s.newGraph);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const doc = exportDocument();
    const safeName = doc.name.trim().replace(/\s+/g, "_").toLowerCase() || "gameplay_graph";
    downloadJson(`${safeName}.json`, doc);
  };

  const handleLoadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      loadDocument(parsed);
    } catch {
      window.alert("Không đọc được file — không phải JSON hợp lệ.");
    }
  };

  const handleNew = () => {
    if (window.confirm("Tạo graph mới? Nội dung chưa lưu sẽ mất.")) newGraph();
  };

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__logo">⛭</span>
        <span className="topbar__title">Gameplay Editor</span>
      </div>

      <input
        className="topbar__name-input"
        value={graphName}
        onChange={(e) => setGraphName(e.target.value)}
        spellCheck={false}
      />

      <div className="topbar__actions">
        <button className="btn" onClick={handleNew}>
          New
        </button>
        <button className="btn" onClick={handleLoadClick}>
          Load JSON
        </button>
        <button className="btn btn--primary" onClick={handleExport}>
          Export JSON
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
      </div>
    </header>
  );
}
