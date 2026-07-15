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

describe("ChatBot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStoredSession).mockReturnValue({
      member: { id: "member-1", access: { aiCoach: false } },
    } as never);
    vi.mocked(getQuickReplies).mockResolvedValue({
      quickReplies: ["Gợi ý bữa sáng"],
    } as never);
    vi.mocked(getChatHistory).mockResolvedValue({
      messages: [],
      quickReplies: [],
    } as never);
  });

  it("exposes an accessible collapsed toggle without loading chat data", () => {
    render(<ChatBot />);

    const toggle = screen.getByRole("button", { name: "Mở NutriBot" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "nutribot-dialog");
    expect(getChatHistory).not.toHaveBeenCalled();
    expect(getQuickReplies).not.toHaveBeenCalled();
  });

  it("opens the dialog with accessible input and controls", async () => {
    const user = userEvent.setup();
    render(<ChatBot />);

    const toggle = screen.getByRole("button", { name: "Mở NutriBot" });
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("textbox", { name: "Tin nhắn cho NutriBot" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi tin nhắn" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Đóng cửa sổ NutriBot" }),
    ).toBeInTheDocument();
  });

  it("loads quick replies from the API", async () => {
    const user = userEvent.setup();
    render(<ChatBot />);
    await user.click(screen.getByRole("button", { name: "Mở NutriBot" }));

    expect(
      await screen.findByRole("button", { name: "Gợi ý bữa sáng" }),
    ).toBeInTheDocument();
    expect(getQuickReplies).toHaveBeenCalledOnce();
    expect(getChatHistory).toHaveBeenCalledOnce();
  });

  it("does not reload chat data when the panel is reopened", async () => {
    const user = userEvent.setup();
    render(<ChatBot />);

    await user.click(screen.getByRole("button", { name: "Mở NutriBot" }));
    await waitFor(() => expect(getChatHistory).toHaveBeenCalledOnce());
    await user.click(
      screen.getByRole("button", { name: "Đóng cửa sổ NutriBot" }),
    );
    await user.click(screen.getByRole("button", { name: "Mở NutriBot" }));

    expect(getQuickReplies).toHaveBeenCalledOnce();
    expect(getChatHistory).toHaveBeenCalledOnce();
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
    render(<ChatBot />);
    await user.click(screen.getByRole("button", { name: "Mở NutriBot" }));
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
    render(<ChatBot />);
    await user.click(screen.getByRole("button", { name: "Mở NutriBot" }));
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
    const user = userEvent.setup();
    render(<ChatBot />);
    await user.click(screen.getByRole("button", { name: "Mở NutriBot" }));

    expect(screen.getByRole("button", { name: "AI Coach" })).toBeEnabled();
  });
});
