import { useState } from "react";
import { Link } from "react-router";
import {
  Crown, Star, Shield, Check, CreditCard, Smartphone, Building2,
  Tag, ChevronDown, Lock, RotateCcw, Leaf, ArrowRight, CheckCircle
} from "lucide-react";

type PlanId = "vip" | "svip";
type PaymentMethod = "card" | "momo" | "zalopay" | "bank";
type Billing = "monthly" | "annual";

const plans: Record<PlanId, { name: string; monthlyPrice: number; icon: typeof Star; color: string; badgeColor: string }> = {
  vip: { name: "VIP", monthlyPrice: 99000, icon: Star, color: "text-green-600", badgeColor: "bg-green-100 text-green-700 border-green-200" },
  svip: { name: "SVIP", monthlyPrice: 199000, icon: Crown, color: "text-amber-600", badgeColor: "bg-amber-100 text-amber-700 border-amber-200" },
};

const paymentMethods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Thẻ tín dụng", icon: CreditCard },
  { id: "momo", label: "MoMo", icon: Smartphone },
  { id: "zalopay", label: "ZaloPay", icon: Smartphone },
  { id: "bank", label: "Ngân hàng", icon: Building2 },
];

const vipFeatures = [
  "Theo dõi calo không giới hạn",
  "Toàn bộ kho công thức Việt",
  "50 tin nhắn AI mỗi ngày",
  "Lập kế hoạch bữa ăn",
  "Không quảng cáo",
];

const svipFeatures = [
  "Tất cả tính năng VIP",
  "AI Coach dinh dưỡng cá nhân",
  "Thực đơn tùy chỉnh hoàn toàn",
  "Tin nhắn AI không giới hạn",
  "Hỗ trợ ưu tiên 24/7",
  "Phân tích thành phần cơ thể",
];

export function Checkout() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("vip");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [completed, setCompleted] = useState(false);

  const plan = plans[selectedPlan];
  const PlanIcon = plan.icon;
  const discount = billing === "annual" ? 0.8 : 1;
  const basePrice = Math.round(plan.monthlyPrice * discount);
  const vat = Math.round(basePrice * (billing === "annual" ? 12 : 1) * 0.1);
  const subtotal = basePrice * (billing === "annual" ? 12 : 1);
  const discountAmount = discountApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + vat - discountAmount;
  const features = selectedPlan === "vip" ? vipFeatures : svipFeatures;

  const formatCard = (val: string) => {
    const v = val.replace(/\D/g, "").slice(0, 16);
    return v.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (val: string) => {
    const v = val.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 2) return v.slice(0, 2) + "/" + v.slice(2);
    return v;
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-gray-900 mb-3" style={{ fontSize: "1.8rem", fontWeight: 800 }}>Thanh toán thành công!</h2>
          <p className="text-gray-500 mb-8" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
            Chào mừng bạn trở thành thành viên <strong>{plan.name}</strong> của NutriPath. Tài khoản của bạn đã được nâng cấp.
          </p>
          <Link to="/member" className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl hover:bg-green-700 transition-all"
            style={{ fontSize: "1rem", fontWeight: 700 }}>
            Xem tài khoản của tôi <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/dashboard" className="block mt-3 text-gray-500 hover:text-gray-700" style={{ fontSize: "0.875rem" }}>
            Về trang Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 800 }}>NutriPath</span>
          </Link>
          <div className="flex items-center gap-2 text-gray-400">
            <Lock className="w-4 h-4 text-green-500" />
            <span style={{ fontSize: "0.875rem" }}>Thanh toán bảo mật SSL</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* LEFT: Order Summary (60%) */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-gray-900" style={{ fontSize: "1.8rem", fontWeight: 800 }}>Tóm tắt đơn hàng</h1>

            {/* Plan selector */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-gray-700 mb-4" style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Chọn gói</h3>
              <div className="grid grid-cols-2 gap-3">
                {(["vip", "svip"] as PlanId[]).map((pid) => {
                  const p = plans[pid];
                  const Icon = p.icon;
                  const isActive = selectedPlan === pid;
                  return (
                    <button
                      key={pid}
                      onClick={() => setSelectedPlan(pid)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        isActive
                          ? pid === "vip" ? "border-green-500 bg-green-50" : "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? p.color : "text-gray-400"}`} />
                      <div className="text-left">
                        <div className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{p.name}</div>
                        <div className="text-gray-500" style={{ fontSize: "0.75rem" }}>{p.monthlyPrice.toLocaleString("vi-VN")}₫/tháng</div>
                      </div>
                      {isActive && <CheckCircle className={`w-5 h-5 ml-auto ${p.color}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Billing period */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-gray-700 mb-4" style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Chu kỳ thanh toán</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${billing === "monthly" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 700 }}>Hàng tháng</div>
                  <div className="text-gray-500" style={{ fontSize: "0.8rem" }}>{plan.monthlyPrice.toLocaleString("vi-VN")}₫/tháng</div>
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={`p-4 rounded-2xl border-2 transition-all text-left relative ${billing === "annual" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  {billing === "annual" && <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">2 tháng miễn phí</span>}
                  <div className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 700 }}>Hàng năm</div>
                  <div className="text-green-600" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{Math.round(plan.monthlyPrice * 0.8).toLocaleString("vi-VN")}₫/tháng</div>
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-gray-700 mb-4" style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Chi tiết thanh toán</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600" style={{ fontSize: "0.9rem" }}>Gói {plan.name} ({billing === "annual" ? "12 tháng" : "1 tháng"})</span>
                  <span className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 600 }}>{subtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                {billing === "annual" && (
                  <div className="flex justify-between text-green-600">
                    <span style={{ fontSize: "0.9rem" }}>Tiết kiệm (thanh toán năm)</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>-{(plan.monthlyPrice * 12 - subtotal).toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                {discountApplied && (
                  <div className="flex justify-between text-green-600">
                    <span style={{ fontSize: "0.9rem" }}>Mã giảm giá (NUTRIPATH10)</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>-{discountAmount.toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span style={{ fontSize: "0.9rem" }}>VAT (10%)</span>
                  <span style={{ fontSize: "0.9rem" }}>{vat.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>

              {/* Discount code */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Mã giảm giá"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-transparent outline-none text-gray-700"
                    style={{ fontSize: "0.875rem" }}
                  />
                </div>
                <button
                  onClick={() => { if (discountCode.length > 0) setDiscountApplied(true); }}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-all"
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}
                >
                  Áp dụng
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Tổng cộng</span>
                <span className="text-green-600" style={{ fontSize: "1.4rem", fontWeight: 800 }}>{total.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>

            {/* What you get */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-gray-700 mb-4" style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Bạn sẽ nhận được</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700" style={{ fontSize: "0.875rem" }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Payment Form (40%) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-gray-900" style={{ fontSize: "1.8rem", fontWeight: 800 }}>Thanh toán</h2>

            {/* Payment method tabs */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-gray-700 mb-4" style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Phương thức</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === id ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <Icon className={`w-4 h-4 ${paymentMethod === id ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`${paymentMethod === id ? "text-green-700" : "text-gray-600"}`} style={{ fontSize: "0.8rem", fontWeight: 600 }}>{label}</span>
                  </button>
                ))}
              </div>

              {/* Credit card form */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Số thẻ</label>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                        className="flex-1 bg-transparent outline-none text-gray-700"
                        style={{ fontSize: "0.9rem", letterSpacing: "0.1em" }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Ngày hết hạn</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 text-gray-700"
                        style={{ fontSize: "0.9rem" }}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 text-gray-700"
                        style={{ fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Tên chủ thẻ</label>
                    <input
                      type="text"
                      placeholder="NGUYEN VAN A"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 text-gray-700"
                      style={{ fontSize: "0.9rem", letterSpacing: "0.05em" }}
                    />
                  </div>
                </div>
              )}

              {/* MoMo */}
              {paymentMethod === "momo" && (
                <div className="text-center">
                  <div className="w-40 h-40 bg-pink-50 border-2 border-pink-200 rounded-2xl flex flex-col items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-12 h-12 text-pink-500 mb-2" />
                    <span className="text-pink-600" style={{ fontSize: "0.8rem", fontWeight: 600 }}>QR Code MoMo</span>
                  </div>
                  <p className="text-gray-500 mb-4" style={{ fontSize: "0.875rem" }}>Quét mã QR bằng app MoMo để thanh toán</p>
                  <button className="w-full bg-pink-500 text-white py-3 rounded-xl hover:bg-pink-600 transition-all" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    Mở app MoMo
                  </button>
                </div>
              )}

              {/* ZaloPay */}
              {paymentMethod === "zalopay" && (
                <div className="text-center">
                  <div className="w-40 h-40 bg-blue-50 border-2 border-blue-200 rounded-2xl flex flex-col items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-12 h-12 text-blue-500 mb-2" />
                    <span className="text-blue-600" style={{ fontSize: "0.8rem", fontWeight: 600 }}>QR Code ZaloPay</span>
                  </div>
                  <p className="text-gray-500 mb-4" style={{ fontSize: "0.875rem" }}>Quét mã QR bằng app ZaloPay để thanh toán</p>
                  <button className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-all" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    Mở app ZaloPay
                  </button>
                </div>
              )}

              {/* Bank Transfer */}
              {paymentMethod === "bank" && (
                <div className="space-y-3">
                  {[
                    { label: "Ngân hàng", value: "Vietcombank" },
                    { label: "Số tài khoản", value: "1234567890" },
                    { label: "Chủ tài khoản", value: "NUTRIPATH VIETNAM" },
                    { label: "Nội dung", value: `NP-${Date.now().toString().slice(-6)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                      <span className="text-gray-500" style={{ fontSize: "0.8rem" }}>{label}</span>
                      <span className="text-gray-900" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                  <p className="text-orange-600 bg-orange-50 rounded-xl px-4 py-3" style={{ fontSize: "0.8rem" }}>
                    ⚠️ Tài khoản sẽ được kích hoạt trong vòng 2-4 giờ sau khi chuyển khoản
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={() => setCompleted(true)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl hover:bg-green-700 transition-all shadow-lg"
              style={{ fontSize: "1.05rem", fontWeight: 700 }}
            >
              <Lock className="w-5 h-5" />
              Hoàn tất thanh toán
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Trust signals */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
              {[
                { icon: Lock, text: "Thanh toán mã hóa SSL 256-bit", color: "text-green-500" },
                { icon: RotateCcw, text: "Hoàn tiền trong vòng 7 ngày nếu không hài lòng", color: "text-blue-500" },
                { icon: Leaf, text: "Hủy đăng ký bất cứ lúc nào, không phí ẩn", color: "text-emerald-500" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                  <span className="text-gray-600" style={{ fontSize: "0.8rem" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
