import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getChatHistory: vi.fn(),
}));

vi.mock("../app/api", () => ({
  getChatHistory: apiMocks.getChatHistory,
}));

import {
  getChatHistoryCached,
  invalidateChatHistoryCache,
} from "../app/services/chatCache";

const firstHistory = {
  messages: [
    {
      id: "message-1",
      sender: "ai" as const,
      text: "Xin chào",
      time: "2026-07-15T08:00:00.000Z",
    },
  ],
  quickReplies: ["Gợi ý bữa sáng"],
};

describe("chat history cache", () => {
  beforeEach(() => {
    invalidateChatHistoryCache();
    vi.useRealTimers();
  });

  it("deduplicates an in-flight request and reuses the cached response", async () => {
    let resolveRequest!: (value: typeof firstHistory) => void;
    const request = new Promise<typeof firstHistory>((resolve) => {
      resolveRequest = resolve;
    });
    apiMocks.getChatHistory.mockReturnValue(request);

    const first = getChatHistoryCached("member-1");
    const second = getChatHistoryCached("member-1");

    expect(first).toBe(second);
    expect(apiMocks.getChatHistory).toHaveBeenCalledTimes(1);

    resolveRequest(firstHistory);
    await expect(first).resolves.toEqual(firstHistory);
    await expect(getChatHistoryCached("member-1")).resolves.toEqual(firstHistory);
    expect(apiMocks.getChatHistory).toHaveBeenCalledTimes(1);
  });

  it("refreshes history after the 60 second TTL expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T08:00:00.000Z"));
    const refreshedHistory = { ...firstHistory, quickReplies: ["Gợi ý bữa tối"] };
    apiMocks.getChatHistory
      .mockResolvedValueOnce(firstHistory)
      .mockResolvedValueOnce(refreshedHistory);

    await expect(getChatHistoryCached("member-1")).resolves.toEqual(firstHistory);
    vi.advanceTimersByTime(60_001);
    await expect(getChatHistoryCached("member-1")).resolves.toEqual(refreshedHistory);

    expect(apiMocks.getChatHistory).toHaveBeenCalledTimes(2);
  });
});
