import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Loader2, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { requestAuthOtp, verifyAuthOtp, type AuthOtpPurpose } from "../api";
import { useLanguage } from "../language";

interface OtpVerificationFormProps {
  email: string;
  purpose: AuthOtpPurpose;
  actionLabel: string;
  onBack: () => void;
  onVerified: (verificationTicket: string) => Promise<void> | void;
}

function maskEmail(email: string) {
  const [localPart, domain = ""] = email.split("@");
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"*".repeat(Math.max(2, localPart.length - visible.length))}@${domain}`;
}

export function OtpVerificationForm({
  email,
  purpose,
  actionLabel,
  onBack,
  onVerified,
}: OtpVerificationFormProps) {
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6,8}$/.test(otp)) {
      setError(t("Mã OTP phải gồm từ 6 đến 8 chữ số."));
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await verifyAuthOtp(email, purpose, otp);
      await onVerified(result.verificationTicket);
    } catch (requestError) {
      setError(t(requestError instanceof Error ? requestError.message : "Không xác minh được mã OTP."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await requestAuthOtp(email, purpose);
      setCooldown(result.retryAfterSeconds || 60);
      setNotice(t("Đã gửi lại mã OTP. Hãy kiểm tra hộp thư của bạn."));
    } catch (requestError) {
      setError(t(requestError instanceof Error ? requestError.message : "Không gửi lại được mã OTP."));
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      <div className="rounded-2xl border border-green-100 bg-green-50 p-5 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white">
          <MailCheck className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-slate-950" style={{ fontSize: "1.15rem", fontWeight: 850 }}>{t("Xác minh email")}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t("Nhập mã OTP đã gửi đến")} <strong className="text-slate-800">{maskEmail(email)}</strong>
        </p>
      </div>

      <label className="block">
        <span className="text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>{t("Mã OTP")}</span>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <input
            autoFocus
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
            className="w-full bg-transparent text-center text-slate-900 outline-none"
            style={{ fontSize: "1.35rem", fontWeight: 850, letterSpacing: "0.35em" }}
            placeholder="000000"
            aria-label={t("Mã OTP")}
          />
        </div>
      </label>

      {(error || notice) && (
        <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-100 bg-red-50 text-red-600" : "border-green-100 bg-green-50 text-green-700"}`}>
          {error || notice}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || otp.length < 6 || otp.length > 8}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-white transition-colors hover:bg-green-700 disabled:opacity-60"
        style={{ fontWeight: 800 }}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {submitting ? t("Đang xác minh...") : t(actionLabel)}
      </button>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button type="button" onClick={onBack} disabled={submitting} className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50">
          <ArrowLeft className="h-4 w-4" /> {t("Đổi email")}
        </button>
        <button type="button" onClick={() => void handleResend()} disabled={cooldown > 0 || resending || submitting} className="inline-flex items-center gap-1.5 font-semibold text-green-700 hover:text-green-800 disabled:text-slate-400">
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {cooldown > 0 ? t("Gửi lại sau {seconds}s", { seconds: cooldown }) : t("Gửi lại OTP")}
        </button>
      </div>
    </form>
  );
}
