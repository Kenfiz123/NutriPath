import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Leaf, Loader2 } from "lucide-react";
import { useAuth } from "../auth";
import { consumeOAuthReturnTo, getCurrentSupabaseSession } from "../supabaseAuth";

export function AuthCallback() {
  const { completeSocialLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    let active = true;

    async function finishLogin() {
      try {
        const session = await getCurrentSupabaseSession();
        if (!session?.access_token) {
          throw new Error("Không nhận được phiên đăng nhập từ Supabase.");
        }

        await completeSocialLogin(session.access_token);
        if (!active) return;
        navigate(consumeOAuthReturnTo(), { replace: true });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không hoàn tất đăng nhập bằng mạng xã hội.");
      }
    }

    void finishLogin();
    return () => {
      active = false;
    };
  }, [completeSocialLogin, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white">
          {error ? <Leaf className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">
          {error ? "Không hoàn tất đăng nhập" : "Đang hoàn tất đăng nhập"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
          {error || "NutriPath đang xác thực tài khoản Google/Facebook của bạn và đồng bộ hồ sơ cá nhân."}
        </p>
        {error ? (
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Quay lại đăng nhập
          </Link>
        ) : null}
      </section>
    </main>
  );
}
