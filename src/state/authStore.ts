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
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        set({ error: error.message });
        return;
      }
      // Supabase trả về user rỗng "identities" (không báo lỗi) khi email đã đăng ký trước đó —
      // đây là cách chính thức để phát hiện case này (chống dò email tồn tại).
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        set({ error: "Email này đã có tài khoản — thử Đăng nhập thay vì Đăng ký." });
        return;
      }
      // Không có session nghĩa là project đang bật "Confirm email" — tài khoản đã tạo nhưng CHƯA
      // đăng nhập được, phải xác nhận qua email trước. Không được set `user` ở đây kẻo app tưởng
      // nhầm là đã đăng nhập trong khi mọi request tới Supabase sau đó sẽ lỗi vì không có session thật.
      if (!data.session) {
        set({ info: `Đã gửi email xác nhận tới ${email} — mở email, bấm xác nhận rồi quay lại bấm Đăng nhập.` });
        return;
      }
      set({ user: toAuthUser(data.user) });
    } catch (e) {
      // signUp/signIn của supabase-js có thể throw thẳng (vd lỗi mạng, sai URL project) thay vì
      // trả về {error} — không bắt ở đây thì `loading` sẽ treo mãi true và người dùng bấm nút
      // không thấy phản hồi gì cả.
      set({ error: e instanceof Error ? e.message : "Không kết nối được tới Supabase — kiểm tra lại URL/key trong .env.local." });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    if (!supabase) {
      set({ error: "Chưa cấu hình Supabase — xem SUPABASE_SETUP.md." });
      return;
    }
    set({ loading: true, error: null, info: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message });
        return;
      }
      set({ user: toAuthUser(data.user) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Không kết nối được tới Supabase — kiểm tra lại URL/key trong .env.local." });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    if (!supabase) return;
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Không đăng xuất được — thử lại." });
    } finally {
      set({ loading: false });
    }
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
