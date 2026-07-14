/**
 * ChatBot Component Tests
 *
 * Tests for the ChatBot component including:
 * - Error handling and display
 * - Message sending
 * - Quick replies
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock API functions
vi.mock("../app/api", () => ({
  getChatHistory: vi.fn(() => Promise.resolve({ messages: [], quickReplies: [] })),
  getQuickReplies: vi.fn(() => Promise.resolve({ quickReplies: ["Gợi ý 1", "Gợi ý 2"] })),
  sendChatMessage: vi.fn(),
  getStoredSession: vi.fn(() => ({
    member: { access: { aiCoach: false } }
  })),
  setStoredSession: vi.fn(),
}));

import { getChatHistory, getQuickReplies, sendChatMessage } from "../app/api";
import { ChatBot } from "../app/components/ChatBot";

describe("ChatBot Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getStoredSession to return session with aiCoach access
    vi.mocked(getStoredSession).mockReturnValue({
      member: { access: { aiCoach: false } }
    });
  });

  describe("Rendering", () => {
    it("should render chat button initially closed", () => {
      render(<ChatBot />);
      const chatButton = screen.getByRole("button", { name: /mở nutribot/i });
      expect(chatButton).toBeInTheDocument();
    });

    it("should open chat when button is clicked", async () => {
      const user = userEvent.setup();
      render(<ChatBot />);

      const chatButton = screen.getByRole("button", { name: /mở nutribot/i });
      await user.click(chatButton);

      const closeButton = screen.getByRole("button", { name: /đóng nutribot/i });
      expect(closeButton).toBeInTheDocument();
    });

    it("should display welcome message when opened", async () => {
      const user = userEvent.setup();
      render(<ChatBot />);

      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      expect(screen.getByText(/xin chào/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error in separate banner, NOT as AI message", async () => {
      const user = userEvent.setup();
      const errorMessage = "Không thể kết nối đến NutriBot";

      // Mock sendChatMessage to reject with error
      vi.mocked(sendChatMessage).mockRejectedValue(new Error(errorMessage));

      render(<ChatBot />);

      // Open chat
      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      // Type and send a message
      const input = screen.getByRole("textbox");
      await user.type(input, "Hello");

      await user.click(screen.getByRole("button", { name: /gửi tin nhắn/i }));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Error should NOT appear as an AI message bubble
      const aiMessages = screen.queryAllByText(errorMessage);
      // Should only appear in error banner, not in message list
      const messageInBubble = aiMessages.some(el =>
        el.closest('[class*="rounded-2xl"]')
      );
      expect(messageInBubble).toBe(false);
    });

    it("should auto-dismiss error after 5 seconds", async () => {
      vi.useFakeTimers();

      const user = userEvent.setup({ advanceTimers: vi.tick });
      vi.mocked(sendChatMessage).mockRejectedValue(new Error("Connection error"));

      render(<ChatBot />);
      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.click(screen.getByRole("button", { name: /gửi tin nhắn/i }));

      await waitFor(() => {
        expect(screen.getByText("Connection error")).toBeInTheDocument();
      });

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.queryByText("Connection error")).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label on chat input", async () => {
      const user = userEvent.setup();
      render(<ChatBot />);

      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-label", expect.stringContaining("NutriBot"));
    });

    it("should have aria-label on send button", async () => {
      const user = userEvent.setup();
      render(<ChatBot />);

      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      const sendButton = screen.getByRole("button", { name: /gửi tin nhắn/i });
      expect(sendButton).toBeInTheDocument();
    });

    it("should have aria-expanded on toggle button", async () => {
      const user = userEvent.setup();
      render(<ChatBot />);

      const chatButton = screen.getByRole("button", { name: /mở nutribot/i });
      expect(chatButton).toHaveAttribute("aria-expanded", "false");

      await user.click(chatButton);

      const closeButton = screen.getByRole("button", { name: /đóng nutribot/i });
      expect(closeButton).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("Quick Replies", () => {
    it("should load and display quick replies", async () => {
      const user = userEvent.setup();
      vi.mocked(getQuickReplies).mockResolvedValue({
        quickReplies: ["Tính calo", "Gợi ý thực đơn", "Hỏi về macro"]
      });

      render(<ChatBot />);
      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      await waitFor(() => {
        expect(screen.getByText("Tính calo")).toBeInTheDocument();
        expect(screen.getByText("Gợi ý thực đơn")).toBeInTheDocument();
      });
    });

    it("should send message when quick reply is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(sendChatMessage).mockResolvedValue({
        messages: [
          { id: "1", sender: "ai", text: "Reply", time: "10:00" }
        ],
        quickReplies: []
      });

      render(<ChatBot />);
      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      await waitFor(() => screen.getByText("Tính calo"));

      await user.click(screen.getByText("Tính calo"));

      expect(sendChatMessage).toHaveBeenCalledWith("Tính calo", "assistant");
    });
  });

  describe("Chat Modes", () => {
    it("should show coach mode toggle for SVIP users", async () => {
      const user = userEvent.setup();
      vi.mocked(getStoredSession).mockReturnValue({
        member: { access: { aiCoach: true } }
      });

      render(<ChatBot />);
      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      const coachButton = screen.getByRole("button", { name: /ai coach/i });
      expect(coachButton).not.toBeDisabled();
    });

    it("should disable coach mode for non-SVIP users", async () => {
      const user = userEvent.setup();
      vi.mocked(getStoredSession).mockReturnValue({
        member: { access: { aiCoach: false } }
      });

      render(<ChatBot />);
      await user.click(screen.getByRole("button", { name: /mở nutribot/i }));

      const coachButton = screen.getByRole("button", { name: /ai coach/i });
      expect(coachButton).toBeDisabled();
    });
  });
});
