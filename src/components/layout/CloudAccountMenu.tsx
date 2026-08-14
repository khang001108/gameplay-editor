import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../state/authStore";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { saveCloudDocument, listCloudDocuments, loadCloudDocument } from "../../lib/cloudApi";
import type { CloudDocType, CloudDocumentRow, CloudDocumentSummary } from "../../types/cloud";

interface CloudAccountMenuProps {
  docType: CloudDocType;
  name: string;
  cloudId: string | null;
  exportData: () => unknown;
  onSaved: (id: string) => void;
  onLoaded: (row: CloudDocumentRow) => void;
}

/** 1 nút "☁" duy nhất — gộp Đăng nhập + Lưu/Mở Cloud vào 1 panel đủ rộng, thay vì nhiều nút nhỏ
 * nhét trong dải cuộn ngang của TopBar (khó thao tác khi màn hình hẹp). */
export function CloudAccountMenu({ docType, name, cloudId, exportData, onSaved, onLoaded }: CloudAccountMenuProps) {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const clearAuthError = useAuthStore((s) => s.clearError);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [docs, setDocs] = useState<CloudDocumentSummary[]>([]);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!isSupabaseConfigured) return null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setCloudError(null);
    try {
      const id = await saveCloudDocument({ id: cloudId, type: docType, name, data: exportData() as never });
      onSaved(id);
    } catch (e) {
      setCloudError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleList = async () => {
    const next = !listOpen;
    setListOpen(next);
    setCloudError(null);
    if (next) {
      setListLoading(true);
      try {
        setDocs(await listCloudDocuments(docType));
      } catch (e) {
        setCloudError(e instanceof Error ? e.message : String(e));
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
      setOpen(false);
    } catch (e) {
      setCloudError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="cloud-account" ref={wrapRef}>
      <button
        className={`btn btn--icon${user ? " btn--primary" : ""}`}
        title={user ? `Đã đăng nhập: ${user.email}` : "Đăng nhập / Lưu Cloud"}
        onClick={() => {
          setOpen((v) => !v);
          clearAuthError();
        }}
      >
        ☁
      </button>

      {open && (
        <div className="cloud-account__panel">
          {!user && (
            <>
              <p className="cloud-account__title">Đăng nhập để lưu Cloud</p>
              <input
                className="field-input"
                type="email"
                placeholder="Email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="field-input"
                type="password"
                placeholder="Mật khẩu"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              {authError && <p className="cloud-account__error">{authError}</p>}
              <div className="map-toolrow">
                <button className="btn btn--sm" disabled={authLoading || !email || !password} onClick={() => signIn(email, password)}>
                  Đăng nhập
                </button>
                <button className="btn btn--sm" disabled={authLoading || !email || !password} onClick={() => signUp(email, password)}>
                  Đăng ký
                </button>
              </div>
              <p className="field-row__help">
                Đăng ký lần đầu — tuỳ cấu hình project, Supabase có thể yêu cầu xác nhận qua email trước khi đăng nhập được.
              </p>
            </>
          )}

          {user && (
            <>
              <div className="cloud-account__user">
                <span title={user.email}>{user.email}</span>
                <button className="btn btn--sm" onClick={() => signOut()}>
                  Đăng xuất
                </button>
              </div>

              <div className="cloud-account__divider" />

              <button className="btn btn--sm cloud-account__full" disabled={saving} onClick={handleSave}>
                {saving ? "Đang lưu…" : cloudId ? "☁ Cập nhật" : "☁ Lưu Cloud"}
              </button>
              <button className="btn btn--sm cloud-account__full" onClick={handleToggleList}>
                {listOpen ? "Ẩn danh sách ▴" : "Mở Cloud ▾"}
              </button>

              {listOpen && (
                <div className="cloud-account__list">
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

              {cloudError && <p className="cloud-account__error">{cloudError}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
