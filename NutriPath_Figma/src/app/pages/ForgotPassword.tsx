import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, Loader2, Lock, Mail } from "lucide-react";
import { Link } from "react-router";
import { OtpVerificationForm } from "../components/OtpVerificationForm";
import { requestAuthOtp, resetPassword } from "../api";
import { useLanguage } from "../language";
import { validatePasswordStrength } from "../passwordPolicy";

type ResetStep = "email" | "otp" | "password" | "success";

export function ForgotPassword() {
  const { t } = useLanguage();
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [verificationTicket, setVerificationTicket] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestAuthOtp(email, "password-reset");
      setStep("otp");
    } catch (requestError) {
      setError(t(requestError instanceof Error ? requestError.message : "Không gửi được mã OTP."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerified = async (ticket: string) => {
    setVerificationTicket(ticket);
    setStep("password");
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setError(t(passwordValidation.message));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("Mật khẩu xác nhận chưa khớp."));
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email, password, verificationTicket);
      setStep("success");
    } catch (requestError) {
      setError(t(requestError instanceof Error ? requestError.message : "Không đặt lại được mật khẩu."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 pb-12 pt-24">
      <section className="mx-auto w-full max-w-[440px] rounded-[24px] border border-gray-100 bg-white p-8 shadow-xl shadow-green-900/5">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-green-700" style={{ fontWeight: 800 }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          NutriPath
        </Link>

        {step === "email" && (
          <>
            <h1 className="text-slate-950" style={{ fontSize: "1.7rem", fontWeight: 850 }}>{t("Quên mật khẩu")}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t("Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.")}</p>
            <form onSubmit={handleRequestOtp} className="mt-7 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent text-slate-800 outline-none" placeholder="ban@email.com" />
                </div>
              </label>
              {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-white hover:bg-green-700 disabled:opacity-60" style={{ fontWeight: 800 }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {submitting ? t("Đang gửi mã OTP...") : t("Gửi mã OTP")}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <OtpVerificationForm
            email={email}
            purpose="password-reset"
            actionLabel="Xác minh mã OTP"
            onBack={() => { setStep("email"); setError(null); }}
            onVerified={handleVerified}
          />
        )}

        {step === "password" && (
          <>
            <h1 className="text-slate-950" style={{ fontSize: "1.7rem", fontWeight: 850 }}>{t("Tạo mật khẩu mới")}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t("Email đã được xác minh. Hãy đặt mật khẩu mới cho tài khoản.")}</p>
            <form onSubmit={handleResetPassword} className="mt-7 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t("Mật khẩu mới")}</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-slate-800 outline-none" placeholder={t("8-128 ký tự, có hoa, thường, số và ký tự đặc biệt")} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-gray-400 hover:text-gray-700" aria-label={t("Hiện hoặc ẩn mật khẩu")}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t("Xác nhận mật khẩu")}</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full bg-transparent text-slate-800 outline-none" placeholder={t("Nhập lại mật khẩu")} />
                </div>
              </label>
              {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-white hover:bg-green-700 disabled:opacity-60" style={{ fontWeight: 800 }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {submitting ? t("Đang cập nhật...") : t("Đặt lại mật khẩu")}
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
            <h1 className="mt-5 text-slate-950" style={{ fontSize: "1.55rem", fontWeight: 850 }}>{t("Đổi mật khẩu thành công")}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t("Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.")}</p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-white hover:bg-green-700" style={{ fontWeight: 800 }}>
              {t("Quay lại đăng nhập")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {step !== "success" && (
          <p className="mt-7 text-center text-sm text-slate-500">
            <Link to="/login" className="font-bold text-green-700 hover:text-green-800">{t("Quay lại đăng nhập")}</Link>
          </p>
        )}
      </section>
    </div>
  );
}
