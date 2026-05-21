import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, X, Crown, Star, Zap, Leaf, ArrowRight, Shield, Sparkles } from "lucide-react";
import { getFaqs, getPlans, getStoredSession, type Plan } from "../api";
import { UpgradeModal } from "../components/UpgradeModal";

const planUi = {
  free: {
    icon: Leaf,
    cardClass: "bg-white border-2 border-green-500",
    nameClass: "text-green-600",
    priceClass: "text-gray-900",
    badgeBg: "",
    btnClass: "border-2 border-green-600 text-green-600 hover:bg-green-50",
    btnLabel: "Bắt đầu miễn phí",
  },
  vip: {
    icon: Star,
    cardClass: "bg-gradient-to-b from-green-600 to-emerald-700 text-white scale-105 shadow-2xl",
    nameClass: "text-green-100",
    priceClass: "text-white",
    badgeBg: "bg-white text-green-700",
    btnClass: "bg-white text-green-700 hover:bg-green-50 shadow-lg",
    btnLabel: "Nâng cấp VIP",
    badge: "Phổ Biến Nhất",
  },
  svip: {
    icon: Crown,
    cardClass: "bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-xl",
    nameClass: "text-amber-100",
    priceClass: "text-white",
    badgeBg: "bg-amber-900/30 text-amber-100 border border-amber-300/40",
    btnClass: "bg-amber-900 text-amber-100 hover:bg-amber-800 shadow-lg",
    btnLabel: "Trở thành SVIP",
    badge: "Cao Cấp Nhất",
  },
};

export function PricingPlans() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"vip" | "svip">("vip");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPlans(billing), getFaqs()])
      .then(([planData, faqData]) => {
        setPlans(planData._embedded.plans);
        setFaqs(faqData._embedded.faqs);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được dữ liệu gói"));
  }, [billing]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-100 py-16">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-4 h-4" />
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Chọn gói phù hợp</span>
          </div>
          <h1 className="text-gray-900 mb-4" style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1.15 }}>
            Đầu tư cho <span className="text-green-600">sức khỏe</span> của bạn
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto mb-8" style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>
            Giá và quyền lợi được tải từ backend, không còn hard-code trong UI.
          </p>
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
            <button onClick={() => setBilling("monthly")} className={`px-5 py-2 rounded-full transition-all ${billing === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`} style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Theo tháng
            </button>
            <button onClick={() => setBilling("annual")} className={`px-5 py-2 rounded-full transition-all flex items-center gap-2 ${billing === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`} style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Theo năm <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>
      </section>

      {error && <div className="max-w-5xl mx-auto mt-8 px-8 text-red-600 bg-red-50 border border-red-100 rounded-2xl p-4">{error}</div>}

      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
            {plans.map((plan) => {
              const ui = planUi[plan.id];
              const Icon = ui.icon;
              const isVip = plan.id === "vip";
              const isSvip = plan.id === "svip";
              const previewPrice = plan.pricePreview?.monthlyPrice ?? plan.monthlyPrice;
              return (
                <div key={plan.id} className={`relative rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl duration-300 ${ui.cardClass}`}>
                  {"badge" in ui && ui.badge && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${ui.badgeBg}`}>
                      {isSvip ? "👑 " : "🔥 "}{ui.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isVip ? "bg-white/20" : isSvip ? "bg-amber-900/30" : "bg-green-100"}`}>
                      <Icon className={`w-6 h-6 ${isVip ? "text-white" : isSvip ? "text-amber-100" : "text-green-600"}`} />
                    </div>
                    <h3 className={`mb-1 ${ui.nameClass}`} style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{plan.name}</h3>
                    <div className="flex items-end gap-1 mb-2">
                      <span className={ui.priceClass} style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>
                        {previewPrice === 0 ? "0₫" : `${previewPrice.toLocaleString("vi-VN")}₫`}
                      </span>
                      {previewPrice > 0 && <span className={`mb-1 ${isVip ? "text-green-200" : isSvip ? "text-amber-200" : "text-gray-400"}`} style={{ fontSize: "0.9rem" }}>/{billing === "annual" ? "tháng" : plan.period}</span>}
                    </div>
                    <p className={`${isVip ? "text-green-100" : isSvip ? "text-amber-100" : "text-gray-500"}`} style={{ fontSize: "0.85rem" }}>{plan.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (plan.id !== "free") {
                        setSelectedPlan(plan.id);
                        setShowModal(true);
                      } else {
                        window.location.assign(getStoredSession() ? "/dashboard" : "/register");
                      }
                    }}
                    className={`w-full py-3.5 rounded-2xl mb-6 transition-all ${ui.btnClass}`}
                    style={{ fontSize: "0.95rem", fontWeight: 700 }}
                  >
                    {ui.btnLabel}
                  </button>

                  <div className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <div key={feature.label} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isVip ? "bg-white/20" : isSvip ? "bg-amber-900/30" : "bg-green-100"}`}>
                            <Check className={`w-3 h-3 ${isVip ? "text-white" : isSvip ? "text-amber-200" : "text-green-600"}`} />
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isVip ? "bg-white/10" : "bg-gray-100"}`}>
                            <X className={`w-3 h-3 ${isVip ? "text-white/40" : "text-gray-300"}`} />
                          </div>
                        )}
                        <span className={`${feature.included ? (isVip || isSvip ? "text-white" : "text-gray-700") : (isVip ? "text-white/40" : "text-gray-300")}`} style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { icon: Shield, text: "Thanh toán bảo mật SSL" },
              { icon: Zap, text: "Kích hoạt ngay lập tức" },
              { icon: Leaf, text: "Hủy bất cứ lúc nào" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-gray-500">
                <Icon className="w-4 h-4 text-green-500" />
                <span style={{ fontSize: "0.875rem" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-8">
          <h2 className="text-gray-900 text-center mb-10" style={{ fontSize: "2rem", fontWeight: 800 }}>Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <button className="w-full text-left px-6 py-4 flex justify-between items-center" onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                  <span className="text-gray-900" style={{ fontSize: "0.95rem", fontWeight: 600 }}>{faq.question}</span>
                  <span className={`text-green-600 transition-transform ${openFaq === faq.id ? "rotate-45" : ""}`} style={{ fontSize: "1.5rem", lineHeight: 1 }}>+</span>
                </button>
                {openFaq === faq.id && (
                  <div className="px-6 pb-4 text-gray-500" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ background: "linear-gradient(135deg, #15803d 0%, #059669 100%)" }}>
        <div className="text-center px-8">
          <h2 className="text-white mb-4" style={{ fontSize: "2rem", fontWeight: 800 }}>Bắt đầu ngay hôm nay</h2>
          <p className="text-green-100 mb-8" style={{ fontSize: "1rem" }}>Dùng thử 14 ngày miễn phí, không cần thẻ tín dụng</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => { setSelectedPlan("vip"); setShowModal(true); }} className="bg-white text-green-700 px-8 py-3.5 rounded-2xl hover:bg-green-50 transition-all shadow-xl" style={{ fontSize: "1rem", fontWeight: 700 }}>
              Dùng thử VIP <ArrowRight className="inline w-4 h-4 ml-1" />
            </button>
            <Link to="/svip" className="bg-amber-500 text-white px-8 py-3.5 rounded-2xl hover:bg-amber-400 transition-all shadow-xl flex items-center gap-2" style={{ fontSize: "1rem", fontWeight: 700 }}>
              <Crown className="w-5 h-5" /> Khám phá SVIP
            </Link>
          </div>
        </div>
      </section>

      {showModal && <UpgradeModal defaultPlan={selectedPlan} onClose={() => setShowModal(false)} />}
    </div>
  );
}
