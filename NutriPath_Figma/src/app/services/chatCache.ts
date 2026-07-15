import { getChatHistory } from "../api";

const CACHE_TTL_MS = 60_000;

type ChatHistoryResponse = Awaited<ReturnType<typeof getChatHistory>>;

interface ChatHistoryCacheEntry {
  expiresAt: number;
  data?: ChatHistoryResponse;
  request?: Promise<ChatHistoryResponse>;
}

const chatHistoryCache = new Map<string, ChatHistoryCacheEntry>();

export function getChatHistoryCached(
  memberId: string,
): Promise<ChatHistoryResponse> {
  const cached = chatHistoryCache.get(memberId);
  if (cached?.data && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }
  if (cached?.request) return cached.request;

  const request = getChatHistory()
    .then((data) => {
      if (chatHistoryCache.get(memberId)?.request === request) {
        chatHistoryCache.set(memberId, {
          data,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }
      return data;
    })
    .catch((error) => {
      if (chatHistoryCache.get(memberId)?.request === request) {
        chatHistoryCache.delete(memberId);
      }
      throw error;
    });

  chatHistoryCache.set(memberId, {
    request,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return request;
}

export function invalidateChatHistoryCache(memberId?: string) {
  if (memberId) chatHistoryCache.delete(memberId);
  else chatHistoryCache.clear();
}
