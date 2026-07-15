import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  initializing: boolean;
  login(email: string, password: string): Promise<AuthSession>;
  loginWithSocialProvider(provider: SocialAuthProvider, returnTo?: string): Promise<void>;
  completeSocialLogin(accessToken: string, options?: { signal?: AbortSignal }): Promise<AuthSession>;
  register(payload: RegisterPayload): Promise<AuthSession>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [initializing, setInitializing] = useState(true);
  const authVersion = useRef(0);

  useEffect(() => {
    let active = true;
    const bootstrapVersion = authVersion.current;

    const handleMemberUpdated = () => {
      setSession(getStoredSession());
    };
    const handleSessionExpired = () => setSession(null);

    window.addEventListener("nutripath:member-updated", handleMemberUpdated);
    window.addEventListener("nutripath:session-expired", handleSessionExpired);
    getMe()
      .then(({ member }) => {
        if (!active || authVersion.current !== bootstrapVersion) return;
        const nextSession = { member };
        setStoredSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => {
        if (!active || authVersion.current !== bootstrapVersion) return;
        clearStoredSession();
        setSession(null);
      })
      .finally(() => {
        if (active && authVersion.current === bootstrapVersion) setInitializing(false);
      });

    return () => {
      active = false;
      window.removeEventListener("nutripath:member-updated", handleMemberUpdated);
      window.removeEventListener("nutripath:session-expired", handleSessionExpired);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    initializing,
    async login(email, password) {
      const nextSession = await apiLogin(email, password);
      authVersion.current += 1;
      setStoredSession(nextSession);
      setSession(nextSession);
      setInitializing(false);
      return nextSession;
    },
    async loginWithSocialProvider(provider, returnTo = "/dashboard") {
      await signInWithSocialProvider(provider, returnTo);
    },
    async completeSocialLogin(accessToken, options = {}) {
      const nextSession = await loginWithSupabase(accessToken, options);
      authVersion.current += 1;
      setStoredSession(nextSession);
      setSession(nextSession);
      setInitializing(false);
      return nextSession;
    },
    async register(payload) {
      const nextSession = await apiRegister(payload);
      authVersion.current += 1;
      setStoredSession(nextSession);
      setSession(nextSession);
      setInitializing(false);
      return nextSession;
    },
    async logout() {
      authVersion.current += 1;
      try {
        await apiLogout();
      } finally {
        await signOutSupabaseAuth().catch(() => {});
        clearStoredSession();
        setSession(null);
        setInitializing(false);
      }
    },
  }), [initializing, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <div className="min-h-[40vh] animate-pulse p-8 text-center text-slate-500 dark:text-slate-300">Đang xác thực phiên đăng nhập...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <div className="min-h-[40vh] animate-pulse p-8 text-center text-slate-500 dark:text-slate-300">Đang xác thực quyền quản trị...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const isAdmin = session.member.role?.toLowerCase() === "admin";

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
