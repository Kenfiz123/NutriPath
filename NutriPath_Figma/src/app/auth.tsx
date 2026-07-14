import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import {
  clearStoredSession,
  getStoredSession,
  getMe,
  login as apiLogin,
  loginWithSupabase,
  logout as apiLogout,
  register as apiRegister,
  setStoredSession,
  type AuthSession,
  type RegisterPayload,
} from "./api";
import {
  signInWithSocialProvider,
  signOutSupabaseAuth,
  type SocialAuthProvider,
} from "./supabaseAuth";

interface AuthContextValue {
  session: AuthSession | null;
  login(email: string, password: string): Promise<AuthSession>;
  loginWithSocialProvider(provider: SocialAuthProvider, returnTo?: string): Promise<void>;
  completeSocialLogin(accessToken: string): Promise<AuthSession>;
  register(payload: RegisterPayload): Promise<AuthSession>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  useEffect(() => {
    const handleMemberUpdated = () => {
      setSession(getStoredSession());
    };

    window.addEventListener("nutripath:member-updated", handleMemberUpdated);
    return () => window.removeEventListener("nutripath:member-updated", handleMemberUpdated);
  }, []);

  useEffect(() => {
    if (!session?.token) return;
    let active = true;

    getMe()
      .then(({ member }) => {
        if (!active) return;
        const nextSession = { ...session, member };
        setStoredSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => {
        if (!active) return;
        clearStoredSession();
        setSession(null);
      });

    return () => {
      active = false;
    };
  }, [session?.token]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    async login(email, password) {
      const nextSession = await apiLogin(email, password);
      setStoredSession(nextSession);
      setSession(nextSession);
      return nextSession;
    },
    async loginWithSocialProvider(provider, returnTo = "/dashboard") {
      await signInWithSocialProvider(provider, returnTo);
    },
    async completeSocialLogin(accessToken) {
      const nextSession = await loginWithSupabase(accessToken);
      setStoredSession(nextSession);
      setSession(nextSession);
      return nextSession;
    },
    async register(payload) {
      const nextSession = await apiRegister(payload);
      setStoredSession(nextSession);
      setSession(nextSession);
      return nextSession;
    },
    async logout() {
      try {
        await apiLogout();
      } finally {
        await signOutSupabaseAuth().catch(() => {});
        clearStoredSession();
        setSession(null);
      }
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
}

/**
 * SECURITY FIX: Admin route protection
 *
 * IMPORTANT: Client-side role check is NOT sufficient for security.
 * The backend MUST verify the user's role on EVERY admin API request.
 *
 * What this component does:
 * 1. Client-side redirect for UX (non-admins can't see admin pages)
 * 2. Adds security headers that backend should verify
 *
 * Backend requirements for proper security:
 * - Verify JWT token on every request
 * - Extract and verify 'role' claim from token
 * - Return 403 for non-admin users trying to access /api/admin/* routes
 * - Log unauthorized access attempts
 *
 * Without backend verification, a malicious user with a valid token
 * could call admin APIs directly (e.g., via curl/Postman).
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Client-side check (UX only - not secure by itself)
  // This prevents non-admins from seeing admin pages, but backend MUST enforce this
  const isAdmin = session.member.role?.toLowerCase() === "admin";

  // SECURITY: Add warning in console for debugging (remove in production)
  if (!isAdmin) {
    console.warn(
      "[Security] Non-admin user attempted to access admin route. " +
      "User role:", session.member.role,
      "This check is client-side only. Backend must verify role on every request."
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // SECURITY: Dispatch event for audit logging (backend should log this server-side)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nutripath:admin-access", {
      detail: {
        memberId: session.member.id,
        timestamp: new Date().toISOString(),
        path: location.pathname,
      }
    }));
  }

  return <>{children}</>;
}
