import { createClient, type Provider, type Session } from "@supabase/supabase-js";

export type SocialAuthProvider = Extract<Provider, "google" | "facebook">;

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const OAUTH_RETURN_KEY = "nutripath_oauth_return_to";

export function isSupabaseAuthConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const supabaseAuthClient = createClient(
  SUPABASE_URL || "https://example.supabase.co",
  SUPABASE_ANON_KEY || "missing-anon-key",
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true,
    },
  },
);

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
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Chưa cấu hình Supabase Auth cho frontend.");
  }

  rememberOAuthReturnTo(returnTo);
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabaseAuthClient.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) throw new Error(error.message);
}

export async function getCurrentSupabaseSession(): Promise<Session | null> {
  if (!isSupabaseAuthConfigured()) return null;
  const { data, error } = await supabaseAuthClient.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session ?? null;
}

export async function signOutSupabaseAuth() {
  if (!isSupabaseAuthConfigured()) return;
  await supabaseAuthClient.auth.signOut();
}
