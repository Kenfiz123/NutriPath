import { getNotifications, type NotificationsResponse } from "../api";

const CACHE_TTL_MS = 30_000;

interface NotificationCacheEntry {
  expiresAt: number;
  data?: NotificationsResponse;
  request?: Promise<NotificationsResponse>;
}

const notificationCache = new Map<string, NotificationCacheEntry>();

export function getNotificationsCached(
  memberId: string,
): Promise<NotificationsResponse> {
  const cached = notificationCache.get(memberId);
  if (cached?.data && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }
  if (cached?.request) return cached.request;

  const request = getNotifications({ limit: 5 })
    .then((data) => {
      notificationCache.set(memberId, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return data;
    })
    .catch((error) => {
      notificationCache.delete(memberId);
      throw error;
    });

  notificationCache.set(memberId, {
    request,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return request;
}

export function invalidateNotificationCache(memberId?: string) {
  if (memberId) notificationCache.delete(memberId);
  else notificationCache.clear();
}
