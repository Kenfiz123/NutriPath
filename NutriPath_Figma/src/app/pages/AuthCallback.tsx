import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Leaf, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../auth";
import { consumeOAuthReturnTo, getCurrentSupabaseSession } from "../supabaseAuth";

const AUTH_CALLBACK_TIMEOUT_MS = 30000;

type AuthStep = "loading" | "verifying" | "syncing" | "error";

function abortError() {
  const error = new Error("OAuth callback aborted.");
  error.name = "AbortError";
  return error;
}

function withAbortSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError());

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => reject(abortError());
    signal.addEventListener("abort", handleAbort, { once: true });
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", handleAbort);
    });
  });
}

export function AuthCallback() {
  const { completeSocialLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<AuthStep>("loading");
  const [attempt, setAttempt] = useState(0);
  const runIdRef = useRef(0);

  useEffect(() => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), AUTH_CALLBACK_TIMEOUT_MS);

    setError(null);
    setStep("verifying");

    async function finishLogin() {
      try {
        const session = await withAbortSignal(getCurrentSupabaseSession(), controller.signal);
        if (!session?.access_token) {
          throw new Error("Không nhận được phiên đăng nhập từ Supabase.");
        }

        if (runIdRef.current !== runId) return;
        setStep("syncing");
        await completeSocialLogin(session.access_token, { signal: controller.signal });
        if (runIdRef.current !== runId || controller.signal.aborted) return;
        navigate(consumeOAuthReturnTo(), { replace: true });
      } catch (err) {
        if (runIdRef.current !== runId) return;
        if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
          setStep("error");
          setError("Hết thời gian xác thực (30 giây). Vui lòng thử lại.");
          return;
        }
        setStep("error");
        setError(err instanceof Error ? err.message : "Không hoàn tất đăng nhập bằng mạng xã hội.");
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    void finishLogin();
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
      if (runIdRef.current === runId) runIdRef.current += 1;
    };
  }, [attempt, completeSocialLogin, navigate]);

  const statusMessage = {
    loading: "Đang tải thông tin đăng nhập...",
    verifying: "Đang xác thực tài khoản Google/Facebook...",
    syncing: "Đang đồng bộ hồ sơ cá nhân...",
    error: error || "Đã xảy ra lỗi không xác định.",
  }[step];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 dark:bg-slate-950">
      <section
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
        aria-live="polite"
        aria-busy={step !== "error"}
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white">
          {step === "error" ? <Leaf className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">
          {step === "error" ? "Không hoàn tất đăng nhập" : "Đang hoàn tất đăng nhập"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
          {statusMessage}
        </p>
        {step !== "error" ? (
          <div className="mt-6 grid grid-cols-2 gap-2" aria-hidden="true">
            <div className={`h-1.5 rounded-full ${step !== "loading" ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            <div className={`h-1.5 rounded-full ${step === "syncing" ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}`} />
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
            <Link
              to="/login"
              className="inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
