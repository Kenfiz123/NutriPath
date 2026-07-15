import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  clearStoredSession,
  getCurrentMemberId,
  getDashboard,
  getStoredSession,
  setStoredSession,
  type AuthSession,
} from "../app/api";

const member = {
  id: "member-123",
  name: "Nguyễn Văn An",
  email: "an@example.com",
} as AuthSession["member"];

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe("cookie-backed API session", () => {
  beforeEach(() => {
    clearStoredSession();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("keeps only member state in memory and removes any legacy localStorage token", () => {
    const session = { member };

    setStoredSession(session);

    expect(getStoredSession()).toEqual(session);
    expect(window.localStorage.setItem).not.toHaveBeenCalled();
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("nutripath_session");
    expect(getCurrentMemberId()).toBe(member.id);
  });

  it("sends the HttpOnly cookie through fetch credentials without an Authorization header", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }));

    await apiFetch<{ ok: boolean }>("/api/auth/me");

    expect(fetch).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({
      credentials: "include",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      }),
    }));
    const requestOptions = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(requestOptions.headers).not.toHaveProperty("Authorization");
  });

  it("clears in-memory state on 401 but not on a legitimate 403 authorization denial", async () => {
    setStoredSession({ member });
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: { message: "Forbidden" } }, 403));

    await expect(apiFetch("/api/admin/overview")).rejects.toThrow("Forbidden");
    expect(getStoredSession()?.member.id).toBe(member.id);

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: { message: "Unauthorized" } }, 401));
    await expect(apiFetch("/api/auth/me")).rejects.toThrow("Unauthorized");
    expect(getStoredSession()).toBeNull();
  });

  it("rejects member-specific calls until the cookie session has been hydrated", () => {
    expect(() => getCurrentMemberId()).toThrow("Bạn cần đăng nhập để xem dữ liệu cá nhân.");
  });

  it("forwards an AbortSignal to dashboard fetch requests", async () => {
    setStoredSession({ member });
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}));
    const controller = new AbortController();

    await getDashboard({ signal: controller.signal });

    const requestOptions = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(requestOptions.signal).toBe(controller.signal);
  });
});
