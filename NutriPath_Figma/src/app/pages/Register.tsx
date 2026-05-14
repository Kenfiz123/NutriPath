import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Eye, EyeOff, Leaf, Lock, Mail, Target, UserRound } from "lucide-react";
import { useAuth } from "../auth";
import type { RegisterPayload } from "../api";

type Goal = NonNullable<RegisterPayload["goal"]>;

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, goal });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được tài khoản.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-[1120px] mx-auto px-6 grid lg:grid-cols-[420px_1fr] gap-10 items-center">
        <section className="bg-white border border-gray-100 shadow-xl shadow-green-900/5 rounded-[24px] p-8">
          <div className="mb-7">
            <Link to="/" className="inline-flex items-center gap-2 text-green-700 mb-6" style={{ fontWeight: 800 }}>
              <span className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </span>
              NutriPath
            </Link>
            <h2 className="text-gray-950" style={{ fontSize: "1.7rem", fontWeight: 850 }}>Đăng ký</h2>
            <p className="text-gray-500 mt-2" style={{ fontSize: "0.92rem" }}>
              Tạo tài khoản để lưu hồ sơ và nhật ký dinh dưỡng trên SQL.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Họ tên</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                <UserRound className="w-4 h-4 text-gray-400" />
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full outline-none text-gray-800"
                  placeholder="Nguyễn Minh An"
                />
              </div>
            </label>

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
              <span className="text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Mục tiêu</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                <Target className="w-4 h-4 text-gray-400" />
                <select
                  value={goal}
                  onChange={(event) => setGoal(event.target.value as Goal)}
                  className="w-full outline-none text-gray-800 bg-transparent"
                >
                  <option value="lose">Giảm cân</option>
                  <option value="maintain">Giữ cân</option>
                  <option value="gain">Tăng cơ</option>
                </select>
              </div>
            </label>

            <label className="block">
              <span className="text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Mật khẩu</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full outline-none text-gray-800"
                  placeholder="Ít nhất 6 ký tự"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-gray-400 hover:text-gray-700">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Xác nhận mật khẩu</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full outline-none text-gray-800"
                  placeholder="Nhập lại mật khẩu"
                />
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
              {submitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6" style={{ fontSize: "0.9rem" }}>
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-green-700 hover:text-green-800" style={{ fontWeight: 800 }}>
              Đăng nhập
            </Link>
          </p>
        </section>

        <section className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[28px] min-h-[620px] bg-emerald-900">
            <img
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80"
              alt="Fresh nutrition ingredients"
              className="absolute inset-0 w-full h-full object-cover opacity-[0.82]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/75 via-green-800/30 to-transparent" />
            <div className="relative z-10 p-10 text-white max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 mb-6">
                <Target className="w-4 h-4" />
                <span style={{ fontSize: "0.86rem", fontWeight: 700 }}>Real Member Data</span>
              </div>
              <h1 style={{ fontSize: "2.8rem", lineHeight: 1.08, fontWeight: 850 }}>
                Mỗi tài khoản có hồ sơ, mục tiêu và dữ liệu riêng.
              </h1>
              <p className="text-green-50 mt-5" style={{ fontSize: "1rem", lineHeight: 1.8 }}>
                Khi đăng ký, backend tạo member thật và credential thật. Website sẽ dùng session để gọi API theo đúng người đang đăng nhập.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
