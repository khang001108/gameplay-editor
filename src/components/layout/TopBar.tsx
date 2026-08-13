import { useRef } from "react";
import { downloadJson } from "../../utils/download";
import { ModeTabs } from "./ModeTabs";
import type { EditorMode } from "../../state/editorMode";

interface TopBarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  name: string;
  onNameChange: (name: string) => void;
  onNew: () => void;
  onLoadJson: (parsed: unknown) => void;
  exportData: () => unknown;
  exportFilePrefix: string;
}

export function TopBar({ mode, onModeChange, name, onNameChange, onNew, onLoadJson, exportData, exportFilePrefix }: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
