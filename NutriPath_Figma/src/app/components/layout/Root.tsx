import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { ChatBot } from "../ChatBot";
import { useAuth } from "../../auth";

export function Root() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
      <Navbar isLanding={isLanding} />
      <main>
        <Outlet />
      </main>
      {session?.member ? <ChatBot /> : null}
    </div>
  );
}
