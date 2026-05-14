import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { ChatBot } from "../ChatBot";

export function Root() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen bg-white">
      <Navbar isLanding={isLanding} />
      <main>
        <Outlet />
      </main>
      <ChatBot />
    </div>
  );
}
