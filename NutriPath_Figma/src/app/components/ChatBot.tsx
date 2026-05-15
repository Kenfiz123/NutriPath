import { useEffect, useRef, useState } from "react";
import { Bot, Crown, Lock, MessageCircle, Mic, Send, User, X } from "lucide-react";
import { getChatHistory, getQuickReplies, getStoredSession, sendChatMessage, setStoredSession } from "../api";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
}

const initialMessages: Message[] = [
  {
    id: "welcome",
    sender: "ai",
    text: "Xin chào! Tôi là NutriBot. Tôi có thể giúp bạn tính calo, gợi ý món ăn và xây dựng thói quen ăn uống lành mạnh.",
    time: "09:00",
  },
];

function TypingIndicator() {
  return (
    <div className="mb-3 flex items-end gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
        <Bot className="h-4 w-4 text-green-600" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-green-400" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-green-400" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-green-400" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<"assistant" | "coach">("assistant");
  const [memberAccess, setMemberAccess] = useState(getStoredSession()?.member.access ?? null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    getQuickReplies()
      .then((data) => setQuickReplies(data.quickReplies))
      .catch(() => setQuickReplies([]));

    getChatHistory()
      .then((data) => {
        if (data.quickReplies?.length) setQuickReplies(data.quickReplies);
        if (data.messages?.length) {
          setMessages(
            data.messages.map((message) => ({
              ...message,
              time: formatMessageTime(message.time),
            })),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const handleMemberUpdated = () => {
      setMemberAccess(getStoredSession()?.member.access ?? null);
    };

    window.addEventListener("nutripath:member-updated", handleMemberUpdated);
    return () => window.removeEventListener("nutripath:member-updated", handleMemberUpdated);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const data = await sendChatMessage(text, chatMode);
      if (data.member) {
        const session = getStoredSession();
        if (session) {
          setStoredSession({ ...session, member: data.member });
        }
        setMemberAccess(data.member.access ?? null);
        window.dispatchEvent(new CustomEvent("nutripath:member-updated", { detail: { member: data.member } }));
      }

      const userEcho = data.messages.find((message) => message.sender === "user");
      const ai = data.messages.find((message) => message.sender === "ai");
      const aiMsg: Message = {
        id: ai?.id ?? `ai-${Date.now()}`,
        sender: "ai",
        text: ai?.text ?? "Tôi chưa nhận được phản hồi từ hệ thống.",
        time: formatMessageTime(ai?.time ?? new Date().toISOString()),
      };

      setIsTyping(false);
      setMessages((prev) => [
        ...prev.map((message) => (message.id === userMsg.id && userEcho ? { ...message, text: userEcho.text } : message)),
        aiMsg,
      ]);
      if (data.quickReplies?.length) {
        setQuickReplies(data.quickReplies);
      }
    } catch (error) {
      setIsTyping(false);
      const message = error instanceof Error ? error.message : "Mình chưa kết nối được NutriBot API. Bạn kiểm tra backend ở cổng 8080 nhé.";
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          sender: "ai",
          text: message,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const coachUnlocked = Boolean(memberAccess?.aiCoach);

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
          style={{ width: "min(380px, calc(100vw - 32px))", height: "min(560px, calc(100vh - 120px))" }}
        >
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  {chatMode === "coach" ? <Crown className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <p className="text-white" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    {chatMode === "coach" ? "NutriBot AI Coach" : "NutriBot AI"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-300" />
                    <span className="text-green-100" style={{ fontSize: "0.75rem" }}>
                      {chatMode === "coach" ? "Cá nhân hóa theo hồ sơ" : "Đang hoạt động"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Đóng NutriBot"
                className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setChatMode("assistant")}
                className={`rounded-full px-3 py-1.5 transition-all ${
                  chatMode === "assistant" ? "bg-white text-green-700" : "bg-white/10 text-white"
                }`}
                style={{ fontSize: "0.75rem", fontWeight: 700 }}
              >
                NutriBot thường
              </button>
              <button
                onClick={() => coachUnlocked && setChatMode("coach")}
                disabled={!coachUnlocked}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
                  chatMode === "coach"
                    ? "bg-amber-300 text-slate-950"
                    : coachUnlocked
                      ? "bg-white/10 text-white"
                      : "bg-white/10 text-white/70"
                }`}
                style={{ fontSize: "0.75rem", fontWeight: 700 }}
              >
                {coachUnlocked ? <Crown className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                AI Coach
              </button>
            </div>

            {!coachUnlocked && (
              <button
                onClick={() => window.location.assign("/svip")}
                className="mt-2 text-left text-green-50/95 transition-colors hover:text-white"
                style={{ fontSize: "0.72rem", fontWeight: 600 }}
              >
                SVIP mở AI Coach cá nhân hóa theo hồ sơ, nhật ký bữa ăn và mục tiêu của bạn.
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50/50 px-4 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-3 flex items-end gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                {msg.sender === "ai" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Bot className="h-4 w-4 text-green-600" />
                  </div>
                )}
                {msg.sender === "user" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-600">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`flex max-w-[80%] flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3.5 py-2.5 shadow-sm ${
                      msg.sender === "user"
                        ? "rounded-2xl rounded-br-sm bg-green-600 text-white"
                        : "rounded-2xl rounded-bl-sm border border-gray-100 bg-white text-gray-800"
                    }`}
                    style={{ fontSize: "0.85rem", lineHeight: 1.5, whiteSpace: "pre-line" }}
                  >
                    {msg.text}
                  </div>
                  <span className="mt-1 px-1 text-gray-400" style={{ fontSize: "0.7rem" }}>{msg.time}</span>
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-gray-100 bg-white px-3 py-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="flex-shrink-0 whitespace-nowrap rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-700 transition-colors hover:bg-green-100"
                style={{ fontSize: "0.75rem" }}
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-3">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={chatMode === "coach" ? "Nhắn mục tiêu hoặc vấn đề dinh dưỡng của bạn..." : "Nhắn tin cho NutriBot..."}
                className="flex-1 bg-transparent text-gray-700 outline-none placeholder-gray-400"
                style={{ fontSize: "0.875rem" }}
              />
              <button className="text-gray-400 transition-colors hover:text-green-600" aria-label="Ghi âm">
                <Mic className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              aria-label="Gửi tin nhắn"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Đóng NutriBot" : "Mở NutriBot"}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 ${
          isOpen ? "bg-gray-700" : "bg-gradient-to-br from-green-500 to-emerald-600"
        }`}
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        {!isOpen && (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
            style={{ fontSize: "0.6rem", fontWeight: 700 }}
          >
            1
          </span>
        )}
      </button>
    </>
  );
}
