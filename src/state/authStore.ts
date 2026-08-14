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

  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

function toAuthUser(u: { id: string; email?: string | null } | null | undefined): AuthUser | null {
  if (!u) return null;
  return { id: u.id, email: u.email ?? "" };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  signUp: async (email, password) => {
    if (!supabase) {
      set({ error: "Chưa cấu hình Supabase — xem SUPABASE_SETUP.md." });
      return;
    }
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ loading: false, user: toAuthUser(data.user) });
  },

  signIn: async (email, password) => {
    if (!supabase) {
      set({ error: "Chưa cấu hình Supabase — xem SUPABASE_SETUP.md." });
      return;
    }
    set({ loading: true, error: null });
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

  clearError: () => set({ error: null }),
}));

if (supabase && isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data }) => {
    useAuthStore.setState({ user: toAuthUser(data.session?.user) });
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ user: toAuthUser(session?.user) });
  });
}
