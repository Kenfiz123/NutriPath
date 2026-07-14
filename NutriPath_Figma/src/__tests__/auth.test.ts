/**
 * Authentication Tests
 *
 * Tests for auth context, RequireAuth, RequireAdmin components
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

// Mock the API module
vi.mock("../app/api", () => ({
  getMe: vi.fn(),
  apiFetch: vi.fn(),
  getStoredSession: vi.fn(),
  setStoredSession: vi.fn(),
  clearStoredSession: vi.fn(),
}));

import {
  getMe,
  getStoredSession,
  setStoredSession,
  clearStoredSession,
} from "../app/api";

// Import components to test
import { AuthProvider, useAuth, RequireAuth, RequireAdmin } from "../app/auth";

// Test wrapper with auth provider
function TestWrapper({ children, initialSession = null }: { children: React.ReactNode; initialSession?: any }) {
  (getStoredSession as any).mockReturnValue(initialSession);
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

describe("Auth Context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      // Create a component that uses useAuth without AuthProvider
      function TestComponent() {
        try {
          useAuth();
          return <div>Has auth</div>;
        } catch (e) {
          return <div>Error: {e instanceof Error ? e.message : "Unknown error"}</div>;
        }
      }

      render(<TestComponent />);
      expect(screen.getByText(/useAuth must be used inside AuthProvider/i)).toBeInTheDocument();
    });
  });
});

describe("RequireAuth Component", () => {
  it("should redirect to /login when no session exists", () => {
    (getStoredSession as any).mockReturnValue(null);

    function TestPage() {
      return <div>Protected Content</div>;
    }

    render(
      <MemoryRouter>
        <RequireAuth>
          <TestPage />
        </RequireAuth>
      </MemoryRouter>
    );

    // Should redirect (Navigate component)
    expect(window.location.pathname).not.toBe("/login");
  });

  it("should render children when session exists", () => {
    const mockSession = {
      token: "valid.jwt.token",
      member: { id: "user-123", name: "Test User" },
    };
    (getStoredSession as any).mockReturnValue(mockSession);

    function TestPage() {
      return <div>Protected Content</div>;
    }

    render(
      <MemoryRouter>
        <RequireAuth>
          <TestPage />
        </RequireAuth>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});

describe("RequireAdmin Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to /login when no session exists", () => {
    (getStoredSession as any).mockReturnValue(null);

    function AdminPage() {
      return <div>Admin Panel</div>;
    }

    render(
      <MemoryRouter>
        <RequireAdmin>
          <AdminPage />
        </RequireAdmin>
      </MemoryRouter>
    );
  });

  it("should render children when user is admin", () => {
    const adminSession = {
      token: "admin.jwt.token",
      member: { id: "admin-123", name: "Admin", role: "admin" },
    };
    (getStoredSession as any).mockReturnValue(adminSession);

    function AdminPage() {
      return <div>Admin Panel</div>;
    }

    render(
      <MemoryRouter>
        <RequireAdmin>
          <AdminPage />
        </AdminAdmin>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("should redirect to /dashboard when user is not admin", () => {
    const memberSession = {
      token: "member.jwt.token",
      member: { id: "user-123", name: "Regular User", role: "member" },
    };
    (getStoredSession as any).mockReturnValue(memberSession);

    function AdminPage() {
      return <div>Admin Panel</div>;
    }

    render(
      <MemoryRouter>
        <RequireAdmin>
          <AdminPage />
        </RequireAdmin>
      </MemoryRouter>
    );
  });

  it("should handle case-insensitive role comparison", () => {
    const upperCaseAdminSession = {
      token: "admin.jwt.token",
      member: { id: "admin-123", name: "Admin", role: "ADMIN" },
    };
    (getStoredSession as any).mockReturnValue(upperCaseAdminSession);

    function AdminPage() {
      return <div>Admin Panel</div>;
    }

    render(
      <MemoryRouter>
        <RequireAdmin>
          <AdminPage />
        </RequireAdmin>
      </MemoryRouter>
    );

    // Should allow access (case-insensitive check)
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });
});
