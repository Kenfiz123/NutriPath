import { useState, useCallback, type ReactNode, Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary for React applications.
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 *
 * IMPORTANT: Error boundaries do NOT catch:
 * - Event handlers (use try/catch)
 * - Async code (use .catch() or try/catch in async functions)
 * - Server-side rendering (SSR) errors
 * - Errors in the boundary itself
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Đã xảy ra lỗi
              </h1>

              <p className="text-gray-500 mb-6" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                Ứng dụng gặp sự cố không mong muốn. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 text-left">
                  <p className="text-xs font-mono text-red-600 bg-red-50 rounded-lg p-3 overflow-auto max-h-32">
                    {this.state.error.message}
                    {"\n"}
                    {this.state.error.stack?.split("\n").slice(0, 3).join("\n")}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tải lại trang
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Quay về trang chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of ErrorBoundary for functional components
 */
interface UseErrorBoundaryOptions {
  onError?: (error: Error) => void;
}

export function useErrorBoundary(options?: UseErrorBoundaryOptions) {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const reportError = useCallback(
    (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[useErrorBoundary] Reporting error:", error);
      options?.onError?.(error);
      setError(error);
    },
    [options]
  );

  const ErrorBoundaryComponent = useCallback(
    ({ children }: { children: ReactNode }) => {
      if (error) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-2xl border border-red-100 shadow-lg p-6 text-center">
                <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-red-500" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
                <p className="text-gray-500 mb-4 text-sm">
                  Vui lòng thử lại hoặc tải lại trang.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetError}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"
                  >
                    Thử lại
                  </button>
                  <button
                    onClick={() => { window.location.href = "/"; }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    Trang chủ
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      return <>{children}</>;
    },
    [error, resetError]
  );

  return { ErrorBoundaryComponent, reportError, error, resetError };
}
