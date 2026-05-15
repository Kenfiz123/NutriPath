import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  CreditCard,
  Crown,
  Leaf,
  Lock,
  RotateCcw,
  Shield,
  Smartphone,
  Star,
  Tag,
} from "lucide-react";
import {
  createPayment,
  getCheckoutQuote,
  getCurrentMemberId,
  getPlans,
  syncStoredMember,
  type CheckoutQuote,
  type Plan,
} from "../api";

type PlanId = "vip" | "svip";
type PaymentMethod = "card" | "momo" | "zalopay" | "bank";
type Billing = "monthly" | "annual";

const paymentMethods: Array<{ id: PaymentMethod; label: string; icon: typeof CreditCard }> = [
  { id: "card", label: "Thẻ tín dụng", icon: CreditCard },
  { id: "momo", label: "MoMo", icon: Smartphone },
  { id: "zalopay", label: "ZaloPay", icon: Smartphone },
  { id: "bank", label: "Ngân hàng", icon: Building2 },
];

const planColors: Record<PlanId, { icon: typeof Star; badge: string; accent: string; subtle: string }> = {
  vip: {
    icon: Star,
    badge: "bg-green-100 text-green-700 border-green-200",
    accent: "text-green-600",
    subtle: "bg-green-50 border-green-200",
  },
  svip: {
    icon: Crown,
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    accent: "text-amber-600",
    subtle: "bg-amber-50 border-amber-200",
  },
};

function formatMoney(amount: number, currency = "VND") {
  return `${amount.toLocaleString("vi-VN")}${currency === "VND" ? "đ" : ` ${currency}`}`;
}

function formatCard(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function Checkout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPlan = searchParams.get("plan") === "svip" ? "svip" : "vip";
  const initialBilling = searchParams.get("billing") === "annual" ? "annual" : "monthly";

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [billing, setBilling] = useState<Billing>(initialBilling);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscountCode, setAppliedDiscountCode] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{
    planName: string;
    quote: CheckoutQuote;
  } | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    getPlans(billing)
      .then((data) => setPlans(data._embedded.plans.filter((plan) => plan.id !== "free")))
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được dữ liệu gói."));
  }, [billing]);

  useEffect(() => {
    setSearchParams({ plan: selectedPlan, billing });
  }, [selectedPlan, billing, setSearchParams]);

  useEffect(() => {
    let active = true;
    setLoadingQuote(true);
    getCheckoutQuote(selectedPlan, billing, appliedDiscountCode)
      .then((data) => {
        if (!active) return;
        setQuote(data.quote);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không lấy được báo giá.");
      })
      .finally(() => {
        if (active) setLoadingQuote(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPlan, billing, appliedDiscountCode]);

  const selectedPlanData = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) ?? null,
    [plans, selectedPlan],
  );

  const palette = planColors[selectedPlan];
  const PlanIcon = palette.icon;

  async function handleCheckout() {
    if (!quote) return;
    if (paymentMethod === "card" && (!cardNumber || !expiry || cvv.length < 3 || !cardName.trim())) {
      setError("Vui lòng nhập đầy đủ thông tin thẻ để tiếp tục.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const memberId = getCurrentMemberId();
      const data = await createPayment({
        memberId,
        planId: selectedPlan,
        billing,
        paymentMethod,
        discountCode: appliedDiscountCode,
      });
      syncStoredMember(data.member);
      setCompleted({
        planName: data.member.subscription?.planId?.toUpperCase() ?? selectedPlan.toUpperCase(),
        quote: data.quote,
      });
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Thanh toán chưa hoàn tất.");
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-gray-900" style={{ fontSize: "1.8rem", fontWeight: 800 }}>Kích hoạt gói thành công</h1>
          <p className="mt-3 text-gray-500" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
            Tài khoản của bạn đã được nâng cấp lên <strong>{completed.planName}</strong>. Quyền mới đã được bật ngay trên dashboard, hồ sơ thành viên và các tính năng liên quan.
          </p>
          <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-left">
            <p className="text-green-700" style={{ fontSize: "0.82rem", fontWeight: 700 }}>Tổng thanh toán</p>
            <p className="mt-1 text-gray-900" style={{ fontSize: "1.35rem", fontWeight: 800 }}>{formatMoney(completed.quote.total, completed.quote.currency)}</p>
          </div>
          <div className="mt-8 space-y-3">
            <Link to="/member" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3.5 text-white hover:bg-green-700" style={{ fontWeight: 700 }}>
              Xem hồ sơ thành viên <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/dashboard" className="block text-gray-500 hover:text-gray-700" style={{ fontSize: "0.88rem" }}>
              Quay về dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white py-4">
        <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-between px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-600">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 800 }}>NutriPath</span>
          </Link>
          <div className="flex items-center gap-2 text-gray-500">
            <Lock className="h-4 w-4 text-green-500" />
            <span style={{ fontSize: "0.875rem" }}>Thanh toán bảo mật</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h1 className="text-gray-900" style={{ fontSize: "1.8rem", fontWeight: 800 }}>Checkout gói thành viên</h1>
              <p className="mt-2 text-gray-500" style={{ fontSize: "0.92rem" }}>
                Báo giá và kích hoạt gói được lấy trực tiếp từ backend, không còn là màn demo cứng.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-gray-700" style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Chọn gói</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {(["vip", "svip"] as PlanId[]).map((planId) => {
                  const plan = plans.find((item) => item.id === planId);
                  const colors = planColors[planId];
                  const Icon = colors.icon;
                  const isActive = selectedPlan === planId;
                  return (
                    <button
                      key={planId}
                      onClick={() => setSelectedPlan(planId)}
                      className={`rounded-2xl border-2 p-4 text-left transition-all ${isActive ? colors.subtle : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? colors.badge : "bg-gray-100 text-gray-500"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-gray-900" style={{ fontSize: "0.95rem", fontWeight: 800 }}>{plan?.name ?? planId.toUpperCase()}</p>
                            {isActive && <CheckCircle className={`h-5 w-5 ${colors.accent}`} />}
                          </div>
                          <p className="mt-1 text-gray-500" style={{ fontSize: "0.82rem" }}>{plan?.description ?? "Đang tải mô tả gói..."}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-gray-700" style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Chu kỳ thanh toán</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${billing === "monthly" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <p className="text-gray-900" style={{ fontSize: "0.92rem", fontWeight: 800 }}>Hàng tháng</p>
                  <p className="mt-1 text-gray-500" style={{ fontSize: "0.82rem" }}>Thanh toán linh hoạt theo tháng</p>
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all ${billing === "annual" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <span className="absolute right-4 top-4 rounded-full bg-green-500 px-2 py-0.5 text-white" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                    -20%
                  </span>
                  <p className="text-gray-900" style={{ fontSize: "0.92rem", fontWeight: 800 }}>Hàng năm</p>
                  <p className="mt-1 text-gray-500" style={{ fontSize: "0.82rem" }}>Tiết kiệm hơn với giá theo năm</p>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-gray-700" style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Phương thức thanh toán</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all ${paymentMethod === id ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <Icon className={`h-4 w-4 ${paymentMethod === id ? "text-green-600" : "text-gray-400"}`} />
                    <span className={paymentMethod === id ? "text-green-700" : "text-gray-600"} style={{ fontSize: "0.82rem", fontWeight: 700 }}>{label}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === "card" && (
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Số thẻ</span>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(event) => setCardNumber(formatCard(event.target.value))}
                      placeholder="1234 5678 9012 3456"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Ngày hết hạn</span>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                        placeholder="MM/YY"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>CVV</span>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 3))}
                        placeholder="123"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Tên chủ thẻ</span>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN A"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </label>
                </div>
              )}

              {paymentMethod !== "card" && (
                <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-gray-600" style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
                  Đây là luồng thanh toán mô phỏng an toàn. Sau khi bấm hoàn tất, backend sẽ kích hoạt gói và không lưu dữ liệu thanh toán nhạy cảm.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette.badge}`}>
                  <PlanIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>{selectedPlanData?.name ?? selectedPlan.toUpperCase()}</p>
                  <p className="text-gray-500" style={{ fontSize: "0.82rem" }}>{selectedPlanData?.description ?? "Đang lấy mô tả gói..."}</p>
                </div>
              </div>

              <div className="mb-4 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(event) => setDiscountInput(event.target.value.toUpperCase())}
                    placeholder="Mã giảm giá"
                    className="w-full bg-transparent outline-none text-gray-700"
                    style={{ fontSize: "0.88rem" }}
                  />
                </div>
                <button
                  onClick={() => setAppliedDiscountCode(discountInput.trim())}
                  className="rounded-xl bg-gray-900 px-4 py-3 text-white hover:bg-gray-700"
                  style={{ fontSize: "0.85rem", fontWeight: 700 }}
                >
                  Áp dụng
                </button>
              </div>

              {loadingQuote || !quote ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center text-gray-400">
                  Đang lấy báo giá từ backend...
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>{quote.planName} ({quote.billing === "annual" ? "12 tháng" : "1 tháng"})</span>
                      <span className="text-gray-900" style={{ fontWeight: 700 }}>{formatMoney(quote.subtotal, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>VAT</span>
                      <span>{formatMoney(quote.vat, quote.currency)}</span>
                    </div>
                    {quote.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá {quote.discountCode}</span>
                        <span>-{formatMoney(quote.discountAmount, quote.currency)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>Tổng thanh toán</p>
                        <p className="mt-1 text-gray-900" style={{ fontSize: "1.6rem", fontWeight: 850 }}>{formatMoney(quote.total, quote.currency)}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 ${palette.badge}`} style={{ fontSize: "0.74rem", fontWeight: 700 }}>
                        {billing === "annual" ? "Theo năm" : "Theo tháng"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-4 text-white shadow-lg transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ fontSize: "1rem", fontWeight: 800 }}
                  >
                    <Lock className="h-5 w-5" />
                    {submitting ? "Đang kích hoạt gói..." : "Hoàn tất thanh toán"}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="space-y-3">
                {[
                  { icon: Shield, text: "Backend không lưu số thẻ, CVV hoặc dữ liệu thanh toán nhạy cảm." },
                  { icon: Lock, text: "Quyền gói được kích hoạt ngay sau khi backend xác nhận thanh toán." },
                  { icon: RotateCcw, text: "Có thể nâng cấp lại bất cứ lúc nào bằng luồng checkout thật." },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span className="text-gray-600" style={{ fontSize: "0.84rem", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
