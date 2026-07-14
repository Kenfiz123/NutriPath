import { createClient, type Provider, type Session } from "@supabase/supabase-js";

export type SocialAuthProvider = Extract<Provider, "google" | "facebook">;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const OAUTH_RETURN_KEY = "nutripath_oauth_return_to";

/**
 * Kiểm tra Supabase Auth đã được cấu hình đầy đủ chưa.
 * @returns true nếu VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY đều được set
 */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Kiểm tra xem app có đang chạy trong môi trường development không.
 * Dùng để hiển thị warning phù hợp cho developer.
 */
function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Wrapper cho createClient - chỉ khởi tạo khi đã có đủ config.
 * Nếu thiếu config:
 * - Dev mode: throw error để developer biết ngay
 * - Production: return null (không crash app)
 */
export function getSupabaseClient() {
  if (!isSupabaseAuthConfigured()) {
    if (isDevelopment()) {
      console.error(
        "[NutriPath] Supabase Auth chưa được cấu hình!\n" +
        "Vui lòng thêm vào file .env:\n" +
        "  VITE_SUPABASE_URL=https://your-project.supabase.co\n" +
        "  VITE_SUPABASE_ANON_KEY=your-anon-key"
      );
    }
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true,
    },
  });
}

/**
 * Lazy-initialized Supabase client - chỉ tạo khi được gọi lần đầu
 * và đã có đủ environment variables.
 *
 * @deprecated Sử dụng getSupabaseClient() thay vì export này.
 *             Export này giữ lại để tương thích ngược.
 */
export const supabaseAuthClient = (() => {
  const client = getSupabaseClient();
  if (client) return client;

  // Return a dummy client only if not configured - this will fail fast if used
  // This prevents the app from silently calling example.supabase.co
  if (isDevelopment()) {
    throw new Error(
      "Supabase chưa được cấu hình. " +
      "Xem console để biết chi tiết."
    );
  }

  // Production: return a stub that will fail gracefully
  return {
    auth: {
      signInWithOAuth: async () => ({ error: { message: "Supabase chưa được cấu hình" } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
  } as ReturnType<typeof createClient>;
})();

export function rememberOAuthReturnTo(path: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OAUTH_RETURN_KEY, path || "/dashboard");
}

export function consumeOAuthReturnTo() {
  if (typeof window === "undefined") return "/dashboard";
  const value = window.sessionStorage.getItem(OAUTH_RETURN_KEY) || "/dashboard";
  window.sessionStorage.removeItem(OAUTH_RETURN_KEY);
  return value;
}

export async function signInWithSocialProvider(provider: SocialAuthProvider, returnTo = "/dashboard") {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Chưa cấu hình Supabase Auth cho frontend.");
  }

  rememberOAuthReturnTo(returnTo);
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) throw new Error(error.message);
}

export async function getCurrentSupabaseSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session ?? null;
}

export async function signOutSupabaseAuth() {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}
