import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowRight, Eye, EyeOff, Leaf, Lock, Mail } from "lucide-react";
import { useAuth } from "../auth";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-[1120px] mx-auto px-6 grid lg:grid-cols-[1fr_420px] gap-10 items-center">
        <section className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[28px] min-h-[560px] bg-green-900">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
              alt="Healthy meal"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-green-950/80 via-green-800/35 to-transparent" />
            <div className="relative z-10 p-10 text-white max-w-lg">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 mb-6">
                <Leaf className="w-4 h-4" />
                <span style={{ fontSize: "0.86rem", fontWeight: 700 }}>NutriPath Account</span>
              </div>
              <h1 style={{ fontSize: "2.8rem", lineHeight: 1.08, fontWeight: 850 }}>
                Theo dõi dinh dưỡng bằng dữ liệu thật của bạn.
              </h1>
              <p className="text-green-50 mt-5" style={{ fontSize: "1rem", lineHeight: 1.8 }}>
                Đăng nhập để dashboard, nhật ký bữa ăn và hồ sơ thành viên lấy đúng dữ liệu từ SQL theo tài khoản hiện tại.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 shadow-xl shadow-green-900/5 rounded-[24px] p-8">
          <div className="mb-7">
            <Link to="/" className="inline-flex items-center gap-2 text-green-700 mb-6" style={{ fontWeight: 800 }}>
              <span className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </span>
              NutriPath
            </Link>
            <h2 className="text-gray-950" style={{ fontSize: "1.7rem", fontWeight: 850 }}>Đăng nhập</h2>
            <p className="text-gray-500 mt-2" style={{ fontSize: "0.92rem" }}>
              Dùng email và mật khẩu đã đăng ký để vào dữ liệu cá nhân.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Email</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full outline-none text-gray-800"
                  placeholder="ban@email.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Mật khẩu</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full outline-none text-gray-800"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-gray-400 hover:text-gray-700">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-600" style={{ fontSize: "0.86rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-white hover:bg-green-700 transition-colors disabled:opacity-60"
              style={{ fontWeight: 800 }}
            >
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6" style={{ fontSize: "0.9rem" }}>
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-green-700 hover:text-green-800" style={{ fontWeight: 800 }}>
              Đăng ký ngay
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
