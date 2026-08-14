import { useState } from "react";
import { useAuthStore } from "../../state/authStore";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

export function AuthPanel() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const clearError = useAuthStore((s) => s.clearError);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isSupabaseConfigured) return null;

  if (user) {
    return (
      <div className="auth-panel">
        <span className="auth-panel__email" title={user.email}>
          {user.email}
        </span>
        <button className="btn btn--sm" onClick={() => signOut()}>
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <button
        className="btn btn--sm"
        onClick={() => {
          setOpen((v) => !v);
          clearError();
        }}
      >
        Đăng nhập
      </button>
      {open && (
        <div className="auth-panel__dropdown">
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
          {error && <p className="auth-panel__error">{error}</p>}
          <div className="map-toolrow">
            <button className="btn btn--sm" disabled={loading || !email || !password} onClick={() => signIn(email, password)}>
              Đăng nhập
            </button>
            <button className="btn btn--sm" disabled={loading || !email || !password} onClick={() => signUp(email, password)}>
              Đăng ký
            </button>
          </div>
          <p className="field-row__help">Đăng ký lần đầu — tuỳ cấu hình project, Supabase có thể yêu cầu xác nhận qua email trước khi đăng nhập được.</p>
        </div>
      )}
    </div>
  );
}
