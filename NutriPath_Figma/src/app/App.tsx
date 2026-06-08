import { RouterProvider } from "react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "./auth";
import { router } from "./routes";
import { ThemeProvider } from "./theme";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <SpeedInsights />
      </AuthProvider>
    </ThemeProvider>
  );
}
