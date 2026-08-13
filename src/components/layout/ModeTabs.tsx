import type { EditorMode } from "../../state/editorMode";

const MODES: { id: EditorMode; label: string; icon: string; enabled: boolean }[] = [
  { id: "ui", label: "UI Editor", icon: "🎨", enabled: false },
  { id: "map", label: "Map Editor", icon: "🗺", enabled: true },
  { id: "gameplay", label: "Gameplay Editor", icon: "⚙️", enabled: true },
  { id: "playtest", label: "Playtest", icon: "🎮", enabled: false },
];

export function ModeTabs({ active, onChange }: { active: EditorMode; onChange: (mode: EditorMode) => void }) {
  return (
    <nav className="mode-tabs">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`mode-tabs__item${active === m.id ? " mode-tabs__item--active" : ""}`}
          disabled={!m.enabled}
          title={m.enabled ? m.label : `${m.label} — sắp có`}
          onClick={() => onChange(m.id)}
        >
          <span className="mode-tabs__icon">{m.icon}</span>
          <span>{m.label}</span>
          {!m.enabled && <span className="mode-tabs__soon">sắp có</span>}
        </button>
      ))}
    </nav>
  );
}
