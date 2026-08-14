import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  /** true khi đang chờ Supabase trả lời (đăng nhập/đăng ký/khởi tạo session) */
  loading: boolean;
  error: string | null;
  /** thông báo trung tính (không phải lỗi), vd nhắc xác nhận email sau khi đăng ký */
  info: string | null;

  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearMessages: () => void;
}

function toAuthUser(u: { id: string; email?: string | null } | null | undefined): AuthUser | null {
  if (!u) return null;
  return { id: u.id, email: u.email ?? "" };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  info: null,

  signUp: async (email, password) => {
    if (!supabase) {
      set({ error: "Chưa cấu hình Supabase — xem SUPABASE_SETUP.md." });
      return;
    }
    set({ loading: true, error: null, info: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    // Supabase trả về user rỗng "identities" (không báo lỗi) khi email đã đăng ký trước đó —
    // đây là cách chính thức để phát hiện case này (chống dò email tồn tại).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      set({ loading: false, error: "Email này đã có tài khoản — thử Đăng nhập thay vì Đăng ký." });
      return;
    }
    // Không có session nghĩa là project đang bật "Confirm email" — tài khoản đã tạo nhưng CHƯA
    // đăng nhập được, phải xác nhận qua email trước. Không được set `user` ở đây kẻo app tưởng
    // nhầm là đã đăng nhập trong khi mọi request tới Supabase sau đó sẽ lỗi vì không có session thật.
    if (!data.session) {
      set({
        loading: false,
        info: `Đã gửi email xác nhận tới ${email} — mở email, bấm xác nhận rồi quay lại bấm Đăng nhập.`,
      });
      return;
    }
    set({ loading: false, user: toAuthUser(data.user) });
  },

  signIn: async (email, password) => {
    if (!supabase) {
      set({ error: "Chưa cấu hình Supabase — xem SUPABASE_SETUP.md." });
      return;
    }
    set({ loading: true, error: null, info: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ loading: false, user: toAuthUser(data.user) });
  },

  signOut: async () => {
    if (!supabase) return;
    set({ loading: true });
    await supabase.auth.signOut();
    set({ loading: false, user: null });
  },

  clearMessages: () => set({ error: null, info: null }),
}));

if (supabase && isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data }) => {
    useAuthStore.setState({ user: toAuthUser(data.session?.user) });
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ user: toAuthUser(session?.user) });
  });
}
