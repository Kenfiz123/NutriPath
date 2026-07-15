import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Leaf, RefreshCw, XCircle } from "lucide-react";
import {
  getVnpayPaymentStatus,
  syncStoredMember,
  verifyVnpayReturn,
  type VnpayPaymentStatus,
} from "../api";

type ResultState = "checking" | "pending" | "paid" | "failed" | "invalid" | "error";

const responseMessages: Record<string, string> = {
  "00": "Giao dịch tại VNPAY thành công.",
  "07": "Giao dịch bị nghi ngờ bất thường và cần được kiểm tra.",
  "09": "Thẻ hoặc tài khoản chưa đăng ký dịch vụ Internet Banking.",
  "10": "Thông tin xác thực giao dịch không đúng quá số lần cho phép.",
  "11": "Giao dịch đã hết thời gian chờ thanh toán.",
  "12": "Thẻ hoặc tài khoản đang bị khóa.",
  "13": "Mã OTP không chính xác.",
  "24": "Bạn đã hủy giao dịch.",
  "51": "Tài khoản không đủ số dư để thanh toán.",
  "65": "Tài khoản đã vượt hạn mức giao dịch trong ngày.",
  "75": "Ngân hàng đang bảo trì.",
  "79": "Thông tin thanh toán không đúng quá số lần cho phép.",
  "99": "VNPAY chưa xác định được lỗi giao dịch.",
};

export function PaymentResult() {
  const [state, setState] = useState<ResultState>("checking");
  const [message, setMessage] = useState("Đang kiểm tra chữ ký và trạng thái giao dịch...");
  const [transactionRef, setTransactionRef] = useState("");
  const [responseCode, setResponseCode] = useState<string | null>(null);
  const responseCodeRef = useRef<string | null>(null);

  const applyPaymentStatus = useCallback((result: VnpayPaymentStatus) => {
    if (result.paymentStatus === "paid" && result.member) {
      syncStoredMember(result.member);
      setState("paid");
      setMessage("Thanh toán thành công. Gói thành viên đã được kích hoạt trên tài khoản của bạn.");
      return true;
    }
    if (result.paymentStatus === "failed") {
      setState("failed");
      setMessage(responseMessages[responseCodeRef.current || ""] || "Giao dịch không thành công. Tài khoản chưa bị trừ quyền hoặc nâng gói.");
      return true;
    }
    setState("pending");
    setMessage("VNPAY đã chuyển bạn về NutriPath. Hệ thống đang chờ IPN xác nhận giao dịch.");
    return false;
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!transactionRef) return false;
    try {
      const result = await getVnpayPaymentStatus(transactionRef);
      return applyPaymentStatus(result);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Không tải được trạng thái giao dịch.");
      return true;
    }
  }, [applyPaymentStatus, transactionRef]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function verifyAndPoll() {
      try {
        const result = await verifyVnpayReturn(window.location.search);
        if (cancelled) return;
        setTransactionRef(result.transactionRef);
        setResponseCode(result.responseCode);
        responseCodeRef.current = result.responseCode;

        if (!result.signatureValid) {
          setState("invalid");
          setMessage("Chữ ký phản hồi VNPAY không hợp lệ. NutriPath không cập nhật gói từ dữ liệu này.");
          return;
        }
        if (result.paymentStatus === "paid" && result.member) {
          syncStoredMember(result.member);
          setState("paid");
          setMessage(result.message);
          return;
        }
        if (result.paymentStatus === "failed" || (result.responseCode && result.responseCode !== "00")) {
          setState("failed");
          setMessage(responseMessages[result.responseCode || ""] || result.message);
          return;
        }
        if (result.paymentStatus === "not_found") {
          setState("invalid");
          setMessage("Không tìm thấy giao dịch tương ứng trong NutriPath.");
          return;
        }

        setState("pending");
        setMessage(result.message);
        let attempts = 0;
        const poll = async () => {
          if (cancelled || attempts >= 10) return;
          attempts += 1;
          const latest = await getVnpayPaymentStatus(result.transactionRef);
          if (cancelled || applyPaymentStatus(latest)) return;
          timer = setTimeout(poll, 2000);
        };
        timer = setTimeout(poll, 1200);
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "Không thể xác minh kết quả thanh toán.");
      }
    }

    verifyAndPoll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [applyPaymentStatus]);

  const visual = state === "paid"
    ? { icon: CheckCircle2, iconClass: "text-green-600 dark:text-green-400", surface: "bg-green-100 dark:bg-green-950/60", title: "Thanh toán thành công" }
    : state === "pending" || state === "checking"
      ? { icon: Clock3, iconClass: "text-amber-600 dark:text-amber-300", surface: "bg-amber-100 dark:bg-amber-950/60", title: state === "checking" ? "Đang xác minh giao dịch" : "Đang chờ VNPAY xác nhận" }
      : state === "invalid"
        ? { icon: AlertTriangle, iconClass: "text-orange-600 dark:text-orange-300", surface: "bg-orange-100 dark:bg-orange-950/60", title: "Phản hồi không hợp lệ" }
        : { icon: XCircle, iconClass: "text-red-600 dark:text-red-300", surface: "bg-red-100 dark:bg-red-950/60", title: "Thanh toán chưa hoàn tất" };
  const StatusIcon = visual.icon;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-14 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:p-10">
        <div className="mb-8 flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white"><Leaf className="h-5 w-5" /></span>
          <span className="text-xl font-extrabold">NutriPath</span>
        </div>
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${visual.surface}`}>
          <StatusIcon className={`h-10 w-10 ${visual.iconClass} ${state === "checking" ? "animate-pulse" : ""}`} />
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold sm:text-3xl">{visual.title}</h1>
        <p className="mt-3 text-center leading-7 text-slate-600 dark:text-slate-300">{message}</p>

        {transactionRef && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">Mã giao dịch</span>
            <span className="break-all text-right font-mono text-sm font-semibold">{transactionRef}</span>
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {state === "pending" && (
            <button type="button" onClick={refreshStatus} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
              <RefreshCw className="h-4 w-4" /> Kiểm tra lại
            </button>
          )}
          <Link to={state === "paid" ? "/member" : "/checkout"} className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700">
            {state === "paid" ? "Xem gói thành viên" : "Quay lại thanh toán"} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/dashboard" className="flex items-center justify-center rounded-xl px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            Về dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
