import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/api", () => ({
  getNotifications: vi.fn(),
}));

import { getNotifications } from "../app/api";
import {
  getNotificationsCached,
  invalidateNotificationCache,
} from "../app/services/notificationCache";

describe("notification cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateNotificationCache();
  });

  it("deduplicates concurrent requests and reuses the short-lived result", async () => {
    const response = {
      unreadCount: 1,
      _embedded: { notifications: [] },
    };
    vi.mocked(getNotifications).mockResolvedValue(response as never);

    const first = getNotificationsCached("member-1");
    const second = getNotificationsCached("member-1");

    await expect(first).resolves.toEqual(response);
    await expect(second).resolves.toEqual(response);
    await expect(getNotificationsCached("member-1")).resolves.toEqual(response);
    expect(getNotifications).toHaveBeenCalledOnce();
  });

  it("keeps notification data isolated by member", async () => {
    vi.mocked(getNotifications).mockResolvedValue({
      unreadCount: 0,
      _embedded: { notifications: [] },
    } as never);

    await getNotificationsCached("member-1");
    await getNotificationsCached("member-2");

    expect(getNotifications).toHaveBeenCalledTimes(2);
  });
});
