import { RouterProvider } from "react-router";
import { AuthProvider } from "./auth";
import { router } from "./routes";
import { ThemeProvider } from "./theme";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
