import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../state/authStore";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { saveCloudDocument, listCloudDocuments, loadCloudDocument } from "../../lib/cloudApi";
import type { CloudDocType, CloudDocumentRow, CloudDocumentSummary } from "../../types/cloud";

interface CloudMenuProps {
  docType: CloudDocType;
  name: string;
  cloudId: string | null;
  exportData: () => unknown;
  onSaved: (id: string) => void;
  onLoaded: (row: CloudDocumentRow) => void;
}

export function CloudMenu({ docType, name, cloudId, exportData, onSaved, onLoaded }: CloudMenuProps) {
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [docs, setDocs] = useState<CloudDocumentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setListOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [listOpen]);

  if (!isSupabaseConfigured) return null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const id = await saveCloudDocument({ id: cloudId, type: docType, name, data: exportData() as never });
      onSaved(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleList = async () => {
    const next = !listOpen;
    setListOpen(next);
    setError(null);
    if (next) {
      setListLoading(true);
      try {
        setDocs(await listCloudDocuments(docType));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setListLoading(false);
      }
    }
  };

  const handlePick = async (id: string) => {
    try {
      const row = await loadCloudDocument(id);
      onLoaded(row);
      setListOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="cloud-menu" ref={wrapRef}>
      <button className="btn btn--sm" disabled={!user || saving} title={user ? "Lưu lên Cloud" : "Đăng nhập để lưu Cloud"} onClick={handleSave}>
        {saving ? "Đang lưu…" : cloudId ? "☁ Cập nhật" : "☁ Lưu"}
      </button>
      <button className="btn btn--sm" disabled={!user} title="Mở map/graph đã lưu Cloud" onClick={handleToggleList}>
        Mở Cloud ▾
      </button>
      {listOpen && (
        <div className="cloud-menu__dropdown">
          {listLoading && <div className="cloud-menu__empty">Đang tải…</div>}
          {!listLoading && docs.length === 0 && <div className="cloud-menu__empty">Chưa có bản lưu nào.</div>}
          {docs.map((d) => (
            <button key={d.id} className="cloud-menu__item" onClick={() => handlePick(d.id)}>
              <span className="cloud-menu__item-name">{d.name}</span>
              <span className="cloud-menu__item-time">{new Date(d.updated_at).toLocaleString("vi-VN")}</span>
            </button>
          ))}
        </div>
      )}
      {error && (
        <span className="cloud-menu__error" title={error}>
          ⚠
        </span>
      )}
    </div>
  );
}
