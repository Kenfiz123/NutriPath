import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { ChatBot } from "../ChatBot";
import { useAuth } from "../../auth";

export function Root() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar isLanding={isLanding} />
      <main>
        <Outlet />
      </main>
      {session?.member ? <ChatBot /> : null}
    </div>
  );
}
