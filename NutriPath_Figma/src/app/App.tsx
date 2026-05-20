import { RouterProvider } from "react-router";
import { AuthProvider } from "./auth";
import { router } from "./routes";
import { ThemeProvider } from "./theme";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
