import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../app/api", () => ({
  getChatHistory: vi.fn(),
  getQuickReplies: vi.fn(),
  getStoredSession: vi.fn(),
  sendChatMessage: vi.fn(),
  setStoredSession: vi.fn(),
}));

import {
  getChatHistory,
  getQuickReplies,
  getStoredSession,
  sendChatMessage,
} from "../app/api";
import { ChatBot } from "../app/components/ChatBot";
import { invalidateChatHistoryCache } from "../app/services/chatCache";
import { LanguageProvider } from "../app/language";

function renderChatBot(memberId = "member-1") {
  const onClose = vi.fn();
  render(<LanguageProvider><ChatBot memberId={memberId} onClose={onClose} /></LanguageProvider>);
  return { onClose };
}

describe("ChatBot", () => {
  beforeEach(() => {
    invalidateChatHistoryCache();
    vi.clearAllMocks();
    vi.mocked(getStoredSession).mockReturnValue({
      member: { id: "member-1", access: { aiCoach: false } },
    } as never);
    vi.mocked(getQuickReplies).mockResolvedValue({
      quickReplies: ["Gợi ý bữa sáng"],
    } as never);
    vi.mocked(getChatHistory).mockResolvedValue({
      messages: [],
      quickReplies: ["Gợi ý bữa sáng"],
    } as never);
  });

  it("renders the mounted dialog with accessible controls", async () => {
    const user = userEvent.setup();
    const { onClose } = renderChatBot();

    expect(
      screen.getByRole("textbox", { name: "Tin nhắn cho NutriBot" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi tin nhắn" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Đóng cửa sổ NutriBot" }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("loads history and quick replies through the cached history request", async () => {
    renderChatBot();

    expect(
      await screen.findByRole("button", { name: "Gợi ý bữa sáng" }),
    ).toBeInTheDocument();
    expect(getChatHistory).toHaveBeenCalledOnce();
    expect(getQuickReplies).not.toHaveBeenCalled();
  });

  it("falls back to the quick replies endpoint when history cannot load", async () => {
    vi.mocked(getChatHistory).mockRejectedValueOnce(new Error("History unavailable"));
    renderChatBot();

    expect(
      await screen.findByRole("button", { name: "Gợi ý bữa sáng" }),
    ).toBeInTheDocument();
    expect(getQuickReplies).toHaveBeenCalledOnce();
  });

  it("sends a message and renders the AI response", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      messages: [
        {
          id: "user-1",
          sender: "user",
          text: "Gợi ý bữa sáng",
          time: new Date().toISOString(),
        },
        {
          id: "ai-1",
          sender: "ai",
          text: "Bạn có thể chọn phở gà ít da.",
          time: new Date().toISOString(),
        },
      ],
      quickReplies: [],
    } as never);
    const user = userEvent.setup();
    renderChatBot();
    await user.type(
      screen.getByRole("textbox", { name: "Tin nhắn cho NutriBot" }),
      "Gợi ý bữa sáng",
    );
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));

    await waitFor(() =>
      expect(sendChatMessage).toHaveBeenCalledWith(
        "Gợi ý bữa sáng",
        "assistant",
      ),
    );
    expect(
      await screen.findByText("Bạn có thể chọn phở gà ít da."),
    ).toBeInTheDocument();
  });

  it("shows transport errors outside the AI message stream", async () => {
    vi.mocked(sendChatMessage).mockRejectedValue(
      new Error("Không thể kết nối NutriBot"),
    );
    const user = userEvent.setup();
    renderChatBot();
    await user.type(
      screen.getByRole("textbox", { name: "Tin nhắn cho NutriBot" }),
      "Xin chào",
    );
    await user.click(screen.getByRole("button", { name: "Gửi tin nhắn" }));

    expect(
      await screen.findByText("Không thể kết nối NutriBot"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Đóng thông báo lỗi" }),
    ).toBeInTheDocument();
  });

  it("enables AI Coach only for an authenticated SVIP entitlement", async () => {
    vi.mocked(getStoredSession).mockReturnValue({
      member: { id: "svip-1", access: { aiCoach: true } },
    } as never);
    renderChatBot("svip-1");

    expect(screen.getByRole("button", { name: "AI Coach" })).toBeEnabled();
    expect(
      await screen.findByRole("button", { name: "Gợi ý bữa sáng" }),
    ).toBeInTheDocument();
  });
});
