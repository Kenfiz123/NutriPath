import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, Bot, User } from "lucide-react";
import { getQuickReplies, sendChatMessage } from "../api";

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
    text: "Xin chào! Tôi là NutriBot 🌿 Tôi có thể giúp bạn tính calo, gợi ý công thức nấu ăn, và lên kế hoạch dinh dưỡng. Hôm nay bạn cần giúp gì?",
    time: "09:00",
  },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-green-600" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
      </div>
    </div>
  );
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
      const data = await sendChatMessage(text);
      const ai = data.messages.find((message) => message.sender === "ai");
      const aiMsg: Message = {
        id: ai?.id ?? `ai-${Date.now()}`,
        sender: "ai",
        text: ai?.text ?? "Tôi chưa nhận được phản hồi từ hệ thống.",
        time: new Date(ai?.time ?? Date.now()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: "ai",
        text: "Mình chưa kết nối được NutriBot API. Bạn kiểm tra backend ở cổng 8080 nhé.",
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ width: "380px", height: "560px" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white" style={{ fontSize: "0.9rem", fontWeight: 700 }}>NutriBot AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                  <span className="text-green-100" style={{ fontSize: "0.75rem" }}>Đang hoạt động</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 mb-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                )}
                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.sender === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`px-3.5 py-2.5 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-green-600 text-white rounded-2xl rounded-br-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm"
                    }`}
                    style={{ fontSize: "0.85rem", lineHeight: 1.5, whiteSpace: "pre-line" }}
                  >
                    {msg.text}
                  </div>
                  <span className="text-gray-400 mt-1 px-1" style={{ fontSize: "0.7rem" }}>{msg.time}</span>
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="flex-shrink-0 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 hover:bg-green-100 transition-colors whitespace-nowrap"
                style={{ fontSize: "0.75rem" }}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhắn tin cho NutriBot..."
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                style={{ fontSize: "0.875rem" }}
              />
              <button className="text-gray-400 hover:text-green-600 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
          isOpen ? "bg-gray-700" : "bg-gradient-to-br from-green-500 to-emerald-600"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white" style={{ fontSize: "0.6rem", fontWeight: 700 }}>
            1
          </span>
        )}
      </button>
    </>
  );
}
