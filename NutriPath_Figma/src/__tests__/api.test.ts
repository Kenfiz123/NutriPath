/**
 * API Utilities Tests
 *
 * Tests for core API functions including:
 * - Session management
 * - Auth helpers
 * - Data transformation utilities
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("getStoredSession", () => {
    it("should return null when no session exists", async () => {
      const { getStoredSession } = await import("../app/api");
      expect(getStoredSession()).toBeNull();
    });

    it("should return session when valid JSON exists", async () => {
      const { getStoredSession, setStoredSession } = await import("../app/api");

      const mockSession = {
        token: "valid.jwt.token",
        member: { id: "user-123", name: "Test User", email: "test@example.com" },
      };

      setStoredSession(mockSession as any);
      const session = getStoredSession();

      expect(session).not.toBeNull();
      expect(session?.token).toBe("valid.jwt.token");
      expect(session?.member.id).toBe("user-123");
    });

    it("should return null when token is missing", async () => {
      const { getStoredSession, setStoredSession } = await import("../app/api");

      const mockSession = {
        token: "",
        member: { id: "user-123" },
      };

      setStoredSession(mockSession as any);
      expect(getStoredSession()).toBeNull();
    });

    it("should return null when member id is missing", async () => {
      const { getStoredSession, setStoredSession } = await import("../app/api");

      const mockSession = {
        token: "valid.jwt.token",
        member: { id: "" },
      };

      setStoredSession(mockSession as any);
      expect(getStoredSession()).toBeNull();
    });

    it("should return null and clear storage on invalid JSON", async () => {
      const { getStoredSession } = await import("../app/api");

      localStorage.setItem("nutripath_session", "invalid-json{");

      expect(getStoredSession()).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith("nutripath_session");
    });
  });

  describe("getCurrentMemberId", () => {
    it("should throw error when no session exists", async () => {
      const { getCurrentMemberId } = await import("../app/api");

      expect(() => getCurrentMemberId()).toThrow("Bạn cần đăng nhập để xem dữ liệu cá nhân.");
    });

    it("should return member id when session exists", async () => {
      const { getCurrentMemberId, setStoredSession } = await import("../app/api");

      const mockSession = {
        token: "valid.jwt.token",
        member: { id: "user-456", name: "Test" },
      };

      setStoredSession(mockSession as any);
      expect(getCurrentMemberId()).toBe("user-456");
    });
  });
});

describe("API Response Validation", () => {
  it("should validate JWT token format", async () => {
    // Token format should be header.payload.signature
    const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const invalidTokens = [
      "not-a-jwt",
      "only-two-parts.here",
      "",
      "invalid-token-with-extra-parts.extra.more",
    ];

    const { getStoredSession, setStoredSession } = await import("../app/api");

    // Valid token should work
    setStoredSession({ token: validToken, member: { id: "test" } } as any);
    expect(getStoredSession()?.token).toBe(validToken);

    // Clear for next test
    localStorage.clear();

    // Invalid tokens should be filtered out
    invalidTokens.forEach((invalidToken) => {
      setStoredSession({ token: invalidToken, member: { id: "test" } } as any);
      expect(getStoredSession()).toBeNull();
    });
  });
});
