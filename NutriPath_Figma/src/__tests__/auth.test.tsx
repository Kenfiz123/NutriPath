import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { ReactNode } from "react";

vi.mock("../app/api", () => ({
  clearStoredSession: vi.fn(),
  getStoredSession: vi.fn(() => null),
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSupabase: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  setStoredSession: vi.fn(),
}));

vi.mock("../app/supabaseAuth", () => ({
  signInWithSocialProvider: vi.fn(),
  signOutSupabaseAuth: vi.fn().mockResolvedValue(undefined),
}));

import { getMe } from "../app/api";
import { AuthProvider, RequireAdmin, RequireAuth, useAuth } from "../app/auth";

const regularMember = {
  id: "member-123",
  name: "Nguyễn Văn An",
  email: "an@example.com",
  role: "member",
};

function SessionStatus() {
  const { session, initializing } = useAuth();
  if (initializing) return <span>Đang tải</span>;
  return <span>{session?.member.email ?? "Chưa đăng nhập"}</span>;
}

function renderRoute(element: ReactNode, path = "/private") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={element} />
          <Route path="/login" element={<div>Trang đăng nhập</div>} />
          <Route path="/dashboard" element={<div>Dashboard thành viên</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("cookie-backed AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hydrates the member from /api/auth/me after a page refresh", async () => {
    vi.mocked(getMe).mockResolvedValue({ member: regularMember } as never);

    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionStatus />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Đang tải")).toBeInTheDocument();
    expect(await screen.findByText(regularMember.email)).toBeInTheDocument();
  });

  it("redirects protected pages to login when the server rejects the cookie", async () => {
    vi.mocked(getMe).mockRejectedValue(new Error("Unauthorized"));

    renderRoute(<RequireAuth><div>Nội dung riêng tư</div></RequireAuth>);

    expect(await screen.findByText("Trang đăng nhập")).toBeInTheDocument();
    expect(screen.queryByText("Nội dung riêng tư")).not.toBeInTheDocument();
  });

  it("keeps a regular member out of the Admin UI", async () => {
    vi.mocked(getMe).mockResolvedValue({ member: regularMember } as never);

    renderRoute(<RequireAdmin><div>Admin Panel</div></RequireAdmin>, "/admin");

    expect(await screen.findByText("Dashboard thành viên")).toBeInTheDocument();
    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
  });

  it("renders Admin UI only after the server-authenticated member is an admin", async () => {
    vi.mocked(getMe).mockResolvedValue({
      member: { ...regularMember, id: "admin-123", role: "admin" },
    } as never);

    renderRoute(<RequireAdmin><div>Admin Panel</div></RequireAdmin>, "/admin");

    expect(await screen.findByText("Admin Panel")).toBeInTheDocument();
  });
});
