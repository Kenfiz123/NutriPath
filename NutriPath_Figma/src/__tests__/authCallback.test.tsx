import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

const mocks = vi.hoisted(() => ({
  completeSocialLogin: vi.fn(),
  consumeOAuthReturnTo: vi.fn(() => "/dashboard"),
  getCurrentSupabaseSession: vi.fn(),
}));

vi.mock("../app/auth", () => ({
  useAuth: () => ({ completeSocialLogin: mocks.completeSocialLogin }),
}));

vi.mock("../app/supabaseAuth", () => ({
  consumeOAuthReturnTo: mocks.consumeOAuthReturnTo,
  getCurrentSupabaseSession: mocks.getCurrentSupabaseSession,
}));

import { AuthCallback } from "../app/pages/AuthCallback";
import { LanguageProvider } from "../app/language";

function renderCallback() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/auth/callback"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("AuthCallback", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the profile sync step and forwards an abort signal to the backend login", async () => {
    let finishProfileSync: (() => void) | undefined;
    mocks.getCurrentSupabaseSession.mockResolvedValue({ access_token: "supabase-access-token" });
    mocks.completeSocialLogin.mockImplementation(() => new Promise<void>((resolve) => {
      finishProfileSync = resolve;
    }));

    renderCallback();

    expect(await screen.findByText("Đang đồng bộ hồ sơ cá nhân...")).toBeInTheDocument();
    expect(mocks.completeSocialLogin).toHaveBeenCalledWith(
      "supabase-access-token",
      { signal: expect.any(AbortSignal) },
    );

    finishProfileSync?.();
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("stops a hanging callback after the deadline and offers a retry", async () => {
    vi.useFakeTimers();
    mocks.getCurrentSupabaseSession.mockReturnValue(new Promise(() => {}));

    renderCallback();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(screen.getByText("Hết thời gian xác thực (30 giây). Vui lòng thử lại.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
