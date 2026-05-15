import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import {
  clearStoredSession,
  getStoredSession,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setStoredSession,
  type AuthSession,
  type RegisterPayload,
} from "./api";

interface AuthContextValue {
  session: AuthSession | null;
  login(email: string, password: string): Promise<AuthSession>;
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

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (session.member.role?.toLowerCase() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
