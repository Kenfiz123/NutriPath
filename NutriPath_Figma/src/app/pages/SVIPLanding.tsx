import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Crown,
  Leaf,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { getPlans, type Plan } from "../api";
import { useAuth } from "../auth";
import { UpgradeModal } from "../components/UpgradeModal";

const planDetails = {
  free: {
    icon: Leaf,
    label: "Miễn phí",
    eyebrow: "Bắt đầu nhẹ nhàng",
    badge: "",
    surface: "bg-white text-slate-950 border-slate-200",
    iconBox: "bg-green-100 text-green-700",
    button: "border border-green-600 text-green-700 hover:bg-green-50",
    accent: "text-green-700",
    bestFor: "Người mới muốn tính calo, thử nhật ký bữa ăn và làm quen với NutriPath.",
    benefits: [
      { icon: BarChart3, text: "Tính BMR, TDEE và mục tiêu calo cơ bản." },
      { icon: BookOpen, text: "Truy cập công thức mẫu để bắt đầu ăn healthy." },
      { icon: UtensilsCrossed, text: "Ghi nhật ký bữa ăn ở mức cơ bản." },
      { icon: MessageCircle, text: "AI chat giới hạn cho câu hỏi dinh dưỡng nhanh." },
    ],
    cta: "Dùng miễn phí",
  },
  vip: {
    icon: Star,
    label: "VIP",
    eyebrow: "Phổ biến nhất",
    badge: "Đề xuất",
    surface: "bg-gradient-to-br from-green-600 to-emerald-700 text-white border-green-400 shadow-2xl shadow-green-900/20 md:scale-[1.03]",
    iconBox: "bg-white/18 text-white",
    button: "bg-white text-green-700 hover:bg-green-50 shadow-lg",
    accent: "text-green-100",
    bestFor: "Người nghiêm túc theo dõi calo mỗi ngày và muốn nhiều công thức, báo cáo hơn.",
    benefits: [
      { icon: UtensilsCrossed, text: "Theo dõi calo và bữa ăn không giới hạn." },
      { icon: BookOpen, text: "Mở khóa kho công thức Việt phong phú hơn." },
      { icon: MessageCircle, text: "Nhiều lượt AI chat dinh dưỡng mỗi ngày." },
      { icon: BarChart3, text: "Báo cáo tiến trình và macro chi tiết hơn." },
      { icon: Shield, text: "Trải nghiệm sạch hơn, ưu tiên tính năng nâng cao." },
    ],
    cta: "Nâng cấp VIP",
  },
  svip: {
    icon: Crown,
    label: "SVIP",
    eyebrow: "Cao cấp nhất",
    badge: "Premium",
    surface: "bg-slate-950 text-white border-amber-400 shadow-2xl shadow-amber-900/20",
    iconBox: "bg-amber-400/15 text-amber-300",
    button: "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-900/25",
    accent: "text-amber-300",
    bestFor: "Người cần huấn luyện cá nhân hóa sâu, AI Coach riêng và hỗ trợ ưu tiên.",
    benefits: [
      { icon: Crown, text: "Bao gồm toàn bộ quyền lợi VIP." },
      { icon: Sparkles, text: "AI Coach dinh dưỡng cá nhân hóa theo mục tiêu." },
      { icon: UtensilsCrossed, text: "Thực đơn tùy chỉnh theo khẩu vị, lịch sinh hoạt và mục tiêu." },
      { icon: MessageCircle, text: "AI chat không giới hạn và phản hồi ưu tiên." },
      { icon: BarChart3, text: "Phân tích tiến trình, macro và thói quen chuyên sâu." },
      { icon: Zap, text: "Hỗ trợ ưu tiên 24/7 cho hành trình sức khỏe." },
    ],
    cta: "Khám phá SVIP",
  },
} satisfies Record<Plan["id"], {
  icon: typeof Leaf;
  label: string;
  eyebrow: string;
  badge: string;
  surface: string;
  iconBox: string;
  button: string;
  accent: string;
  bestFor: string;
  benefits: Array<{ icon: typeof Leaf; text: string }>;
  cta: string;
}>;

const comparisonRows = [
  { label: "Tính calo, BMR, TDEE", free: true, vip: true, svip: true },
  { label: "Nhật ký bữa ăn", free: "Cơ bản", vip: "Không giới hạn", svip: "Không giới hạn + gợi ý tối ưu" },
  { label: "Kho công thức", free: "Giới hạn", vip: "Mở rộng", svip: "Mở rộng + độc quyền" },
  { label: "AI chat dinh dưỡng", free: "Giới hạn", vip: "Nhiều lượt/ngày", svip: "Không giới hạn" },
  { label: "AI Coach cá nhân", free: false, vip: false, svip: true },
  { label: "Báo cáo chuyên sâu", free: false, vip: true, svip: true },
  { label: "Hỗ trợ ưu tiên 24/7", free: false, vip: false, svip: true },
];

function formatPrice(plan: Plan, billing: "monthly" | "annual") {
  const previewPrice = plan.pricePreview?.monthlyPrice ?? plan.monthlyPrice;
  if (previewPrice === 0) return "0đ";
  return `${previewPrice.toLocaleString("vi-VN")}đ`;
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-green-500" />;
  }
  if (value === false) {
    return <span className="text-slate-300">-</span>;
  }
  return <span>{value}</span>;
}

export function SVIPLanding() {
  const { session } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"vip" | "svip">("svip");

  useEffect(() => {
    getPlans(billing)
      .then((data) => {
        setPlans(data._embedded.plans);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được dữ liệu gói."));
  }, [billing]);

  const orderedPlans = [...plans].sort((a, b) => ["free", "vip", "svip"].indexOf(a.id) - ["free", "vip", "svip"].indexOf(b.id));
  const svipPlan = plans.find((plan) => plan.id === "svip");
  const svipMonthly = svipPlan ? formatPrice(svipPlan, billing) : "199.000đ";

  const handlePaidPlan = (planId: "vip" | "svip") => {
    setSelectedPlan(planId);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_80%_10%,rgba(245,166,35,0.22),transparent_32%),linear-gradient(135deg,#0f2d1c_0%,#102316_52%,#0f172a_100%)]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-amber-200">
                <Crown className="h-4 w-4" />
                <span style={{ fontSize: "0.86rem", fontWeight: 800 }}>Gói thành viên NutriPath</span>
              </div>
              <h1 className="mt-6 max-w-3xl text-white" style={{ fontSize: "clamp(2.5rem, 5vw, 4.6rem)", lineHeight: 1.02, fontWeight: 900 }}>
                Chọn lộ trình sức khỏe phù hợp với bạn
              </h1>
              <p className="mt-5 max-w-2xl text-white/72" style={{ fontSize: "1.08rem", lineHeight: 1.8 }}>
                Free để bắt đầu, VIP để theo dõi nghiêm túc, SVIP để có AI Coach cá nhân hóa sâu. Cả ba gói đều được đồng bộ từ dữ liệu thành viên hiện tại.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {[
                  { icon: Leaf, text: "Free cho người mới" },
                  { icon: Star, text: "VIP cho theo dõi hằng ngày" },
                  { icon: Crown, text: "SVIP cho cá nhân hóa sâu" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-white/85">
                    <Icon className="h-4 w-4 text-amber-300" />
                    <span style={{ fontSize: "0.86rem", fontWeight: 700 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-amber-300/35 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-amber-200" style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.12em" }}>NUTRIPATH SVIP</p>
                  <h2 className="mt-2" style={{ fontSize: "1.5rem", fontWeight: 900 }}>AI Coach cao cấp</h2>
                </div>
                <div className="rounded-2xl bg-amber-300/15 p-3 text-amber-200">
                  <Sparkles className="h-7 w-7" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 py-6">
                {[
                  ["Gói", "3 lựa chọn"],
                  ["SVIP từ", `${svipMonthly}/tháng`],
                  ["Thanh toán", billing === "annual" ? "Theo năm" : "Theo tháng"],
                  ["Tài khoản", session?.member?.name ? "Đã đăng nhập" : "Khách"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/8 p-4">
                    <p className="text-white/45" style={{ fontSize: "0.74rem", fontWeight: 700 }}>{label}</p>
                    <p className="mt-1 text-amber-200" style={{ fontSize: "1rem", fontWeight: 850 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="text-white/75" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
                  SVIP không thay thế Free hay VIP. Trang này giúp bạn nhìn rõ từng cấp quyền lợi để chọn đúng gói trước khi nâng cấp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 text-slate-950">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8">
          <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-green-700" style={{ fontSize: "0.82rem", fontWeight: 850, letterSpacing: "0.12em" }}>SO SÁNH 3 GÓI</p>
              <h2 className="mt-2" style={{ fontSize: "clamp(2rem, 3vw, 3rem)", lineHeight: 1.12, fontWeight: 900 }}>
                Quyền lợi rõ ràng cho từng nhu cầu
              </h2>
              <p className="mt-3 max-w-2xl text-slate-500" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
                Giá và tên gói lấy từ backend; phần mô tả bên dưới giải thích cụ thể bạn nhận được gì ở Free, VIP và SVIP.
              </p>
            </div>

            <div className="inline-flex w-fit items-center rounded-full bg-slate-200 p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-5 py-2 transition-all ${billing === "monthly" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                style={{ fontSize: "0.9rem", fontWeight: 800 }}
              >
                Theo tháng
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`rounded-full px-5 py-2 transition-all ${billing === "annual" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                style={{ fontSize: "0.9rem", fontWeight: 800 }}
              >
                Theo năm -20%
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {orderedPlans.map((plan) => {
              const detail = planDetails[plan.id];
              const Icon = detail.icon;
              const isPaid = plan.id !== "free";
              return (
                <article key={plan.id} className={`relative flex h-full flex-col rounded-[26px] border p-6 ${detail.surface}`}>
                  {detail.badge && (
                    <div className="absolute right-5 top-5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                      {detail.badge}
                    </div>
                  )}

                  <div className={`mb-5 flex h-13 w-13 items-center justify-center rounded-2xl ${detail.iconBox}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className={detail.accent} style={{ fontSize: "0.82rem", fontWeight: 850 }}>{detail.eyebrow}</p>
                  <h3 className="mt-2" style={{ fontSize: "2rem", lineHeight: 1, fontWeight: 900 }}>{detail.label}</h3>
                  <div className="mt-5 flex items-end gap-2">
                    <span style={{ fontSize: "2.35rem", lineHeight: 1, fontWeight: 950 }}>{formatPrice(plan, billing)}</span>
                    {plan.monthlyPrice > 0 && <span className={plan.id === "free" ? "text-slate-400" : "text-white/65"}>/tháng</span>}
                  </div>
                  {billing === "annual" && plan.monthlyPrice > 0 && (
                    <p className={plan.id === "svip" ? "mt-2 text-amber-200" : "mt-2 text-green-100"} style={{ fontSize: "0.84rem", fontWeight: 700 }}>
                      Thanh toán năm, tiết kiệm 20% so với tháng.
                    </p>
                  )}
                  <p className={`mt-5 ${plan.id === "free" ? "text-slate-500" : "text-white/75"}`} style={{ fontSize: "0.94rem", lineHeight: 1.7 }}>
                    {detail.bestFor}
                  </p>

                  <div className="mt-6 space-y-3">
                    {detail.benefits.map(({ icon: BenefitIcon, text }) => (
                      <div key={text} className="flex gap-3">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${plan.id === "free" ? "bg-green-50 text-green-700" : "bg-white/12 text-white"}`}>
                          <BenefitIcon className="h-4 w-4" />
                        </span>
                        <span className={plan.id === "free" ? "text-slate-700" : "text-white/86"} style={{ fontSize: "0.9rem", lineHeight: 1.55 }}>
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-7">
                    {isPaid ? (
                      <button
                        onClick={() => handlePaidPlan(plan.id)}
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 transition-all ${detail.button}`}
                        style={{ fontSize: "0.96rem", fontWeight: 850 }}
                      >
                        {detail.cta}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <Link
                        to={session ? "/dashboard" : "/register"}
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 transition-all ${detail.button}`}
                        style={{ fontSize: "0.96rem", fontWeight: 850 }}
                      >
                        {detail.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 text-slate-950">
        <div className="max-w-[1120px] mx-auto px-6 md:px-8">
          <div className="mb-8 text-center">
            <p className="text-amber-600" style={{ fontSize: "0.82rem", fontWeight: 850, letterSpacing: "0.12em" }}>BẢNG QUYỀN LỢI</p>
            <h2 className="mt-2" style={{ fontSize: "2.2rem", fontWeight: 900 }}>Free, VIP và SVIP khác nhau ở đâu?</h2>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] bg-slate-950 text-white">
              {["Tính năng", "Free", "VIP", "SVIP"].map((heading) => (
                <div key={heading} className="px-4 py-4 text-center first:text-left" style={{ fontSize: "0.88rem", fontWeight: 850 }}>
                  {heading}
                </div>
              ))}
            </div>
            {comparisonRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[1.4fr_repeat(3,1fr)] border-t border-slate-100">
                <div className="px-4 py-4 text-slate-700" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{row.label}</div>
                <div className="px-4 py-4 text-center text-slate-600" style={{ fontSize: "0.84rem" }}><FeatureValue value={row.free} /></div>
                <div className="px-4 py-4 text-center text-slate-600" style={{ fontSize: "0.84rem" }}><FeatureValue value={row.vip} /></div>
                <div className="px-4 py-4 text-center text-slate-600" style={{ fontSize: "0.84rem", fontWeight: 700 }}><FeatureValue value={row.svip} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-950 py-16 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <Crown className="mx-auto mb-5 h-12 w-12 text-amber-300" />
          <h2 style={{ fontSize: "2.4rem", fontWeight: 900 }}>Muốn cá nhân hóa sâu hơn?</h2>
          <p className="mt-4 text-white/65" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
            Bắt đầu miễn phí, nâng lên VIP khi bạn cần theo dõi đều đặn, hoặc chọn SVIP khi muốn AI Coach đồng hành như một chuyên gia riêng.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handlePaidPlan("svip")}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-7 py-3.5 text-slate-950 hover:bg-amber-300"
              style={{ fontWeight: 900 }}
            >
              Chọn SVIP
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-7 py-3.5 text-white/85 hover:bg-white/8"
              style={{ fontWeight: 800 }}
            >
              Xem trang gói thành viên
            </Link>
          </div>
        </div>
      </section>

      {showModal && <UpgradeModal defaultPlan={selectedPlan} onClose={() => setShowModal(false)} />}
    </div>
  );
}
