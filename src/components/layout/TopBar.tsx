import { useRef } from "react";
import { downloadJson } from "../../utils/download";
import { ModeTabs } from "./ModeTabs";
import { AuthPanel } from "./AuthPanel";
import { CloudMenu } from "./CloudMenu";
import { ThemeToggle } from "./ThemeToggle";
import { useUiStore } from "../../state/uiStore";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { EditorMode } from "../../state/editorMode";
import type { CloudDocType, CloudDocumentRow } from "../../types/cloud";

interface TopBarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  name: string;
  onNameChange: (name: string) => void;
  onNew: () => void;
  onLoadJson: (parsed: unknown) => void;
  exportData: () => unknown;
  exportFilePrefix: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  cloudDocType: CloudDocType;
  cloudId: string | null;
  onCloudSaved: (id: string) => void;
  onCloudLoaded: (row: CloudDocumentRow) => void;
}

export function TopBar({
  mode,
  onModeChange,
  name,
  onNameChange,
  onNew,
  onLoadJson,
  exportData,
  exportFilePrefix,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  cloudDocType,
  cloudId,
  onCloudSaved,
  onCloudLoaded,
}: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const inspectorOpen = useUiStore((s) => s.inspectorOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleInspector = useUiStore((s) => s.toggleInspector);

  const handleExport = () => {
    const data = exportData();
    const safeName = name.trim().replace(/\s+/g, "_").toLowerCase() || exportFilePrefix;
    downloadJson(`${safeName}.json`, data);
  };

  const handleLoadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      onLoadJson(parsed);
    } catch {
      window.alert("Không đọc được file — không phải JSON hợp lệ.");
    }
  };

  const handleNew = () => {
    if (window.confirm("Tạo mới? Nội dung chưa lưu sẽ mất.")) onNew();
  };

  return (
    <header className="topbar">
      <button
        className={`btn btn--icon topbar__drawer-toggle${sidebarOpen ? " btn--primary" : ""}`}
        title="Công cụ"
        onClick={toggleSidebar}
      >
        ☰
      </button>

      <div className="topbar__brand">
        <span className="topbar__logo">⛭</span>
        <span className="topbar__title">Game Editor</span>
      </div>

      <ModeTabs active={mode} onChange={onModeChange} />

      <input
        className="topbar__name-input"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        spellCheck={false}
      />

      <div className="topbar__actions">
        <button className="btn btn--icon" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
          ↶
        </button>
        <button className="btn btn--icon" title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo}>
          ↷
        </button>
        <span className="topbar__sep" />
        <button className="btn btn--sm" onClick={handleNew}>
          New
        </button>
        <button className="btn btn--sm" onClick={handleLoadClick}>
          Load
        </button>
        <button className="btn btn--sm btn--primary" onClick={handleExport}>
          Export
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />

        {isSupabaseConfigured && (
          <>
            <span className="topbar__sep" />
            <CloudMenu docType={cloudDocType} name={name} cloudId={cloudId} exportData={exportData} onSaved={onCloudSaved} onLoaded={onCloudLoaded} />
            <AuthPanel />
          </>
        )}

        <span className="topbar__sep" />
        <ThemeToggle />

        <button
          className={`btn btn--icon topbar__drawer-toggle${inspectorOpen ? " btn--primary" : ""}`}
          title="Thuộc tính"
          onClick={toggleInspector}
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
