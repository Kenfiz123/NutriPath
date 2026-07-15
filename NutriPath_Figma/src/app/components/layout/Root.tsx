import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { MessageCircle, X } from "lucide-react";
import { Navbar } from "./Navbar";
import { ChatBot } from "../ChatBot";
import { useAuth } from "../../auth";
import { useLanguage } from "../../language";

export function Root() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { session } = useAuth();
  const { t } = useLanguage();
  const memberId = session?.member.id;
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setChatOpen(false);
  }, [memberId]);

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
      <Navbar isLanding={isLanding} />
      <main>
        <Outlet />
      </main>
      {memberId ? (
        <>
          <button
            type="button"
            onClick={() => setChatOpen((current) => !current)}
            aria-label={chatOpen ? t("Đóng NutriBot") : t("Mở NutriBot")}
            aria-controls="nutribot-dialog"
            aria-expanded={chatOpen}
            className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 ${
              chatOpen
                ? "bg-gray-700"
                : "bg-gradient-to-br from-green-500 to-emerald-600"
            }`}
          >
            {chatOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <MessageCircle className="h-6 w-6 text-white" />
            )}
            {!chatOpen ? (
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                style={{ fontSize: "0.6rem", fontWeight: 700 }}
              >
                1
              </span>
            ) : null}
          </button>
          {chatOpen ? (
            <ChatBot memberId={memberId} onClose={() => setChatOpen(false)} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
