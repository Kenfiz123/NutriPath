import { RouterProvider } from "react-router";
import { AuthProvider } from "./auth";
import { router } from "./routes";
import { ThemeProvider } from "./theme";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LanguageProvider } from "./language";

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
