import { useState } from "react";
import { Link } from "react-router";
import { Crown, Check, Star, Zap, Shield, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../auth";

const svipFeatures = [
  "AI Coach dinh dưỡng cá nhân riêng cho bạn",
  "Thực đơn tuần tùy chỉnh hoàn toàn",
  "Phân tích thành phần cơ thể chuyên sâu",
  "Tin nhắn AI không giới hạn mỗi ngày",
  "Công thức độc quyền từ chuyên gia dinh dưỡng",
  "Hỗ trợ ưu tiên 24/7 qua chat & email",
  "Báo cáo sức khỏe chi tiết hàng tuần",
  "Tích hợp thiết bị đeo sức khỏe",
];

const benefits = [
  { icon: Crown, label: "AI Coach riêng", desc: "Trợ lý AI được cá nhân hóa hoàn toàn cho mục tiêu của bạn" },
  { icon: Sparkles, label: "Thực đơn tùy chỉnh", desc: "Kế hoạch ăn uống được tạo riêng theo sở thích và mục tiêu" },
  { icon: Zap, label: "Hỗ trợ ưu tiên 24/7", desc: "Đội ngũ chuyên gia sẵn sàng hỗ trợ mọi lúc bạn cần" },
];

const testimonials = [
  {
    name: "Nguyễn Thị Lan",
    role: "SVIP Member · 6 tháng",
    text: "AI Coach của NutriPath SVIP đã giúp tôi giảm 8kg trong 3 tháng với thực đơn phù hợp hoàn toàn. Tuyệt vời!",
    avatar: "NL",
    color: "bg-green-600",
  },
  {
    name: "Trần Minh Khoa",
    role: "SVIP Member · 1 năm",
    text: "Phân tích thành phần cơ thể chi tiết và kế hoạch dinh dưỡng cá nhân hóa — tôi chưa thấy app nào làm tốt như vậy.",
    avatar: "TK",
    color: "bg-amber-600",
  },
  {
    name: "Phạm Thu Hà",
    role: "SVIP Member · 8 tháng",
    text: "Hỗ trợ 24/7 cực kỳ nhanh chóng và chuyên nghiệp. SVIP xứng đáng từng đồng đầu tư.",
    avatar: "PH",
    color: "bg-emerald-600",
  },
];

export function SVIPLanding() {
  const { session } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const previewMember = session?.member ?? { name: "Tài khoản của bạn", initials: "NP" };

  const monthlyPrice = 199000;
  const annualMonthlyPrice = Math.round(monthlyPrice * 0.8);
  const annualTotal = annualMonthlyPrice * 12;

  return (
    <div className="min-h-screen" style={{ background: "#0f2d1c" }}>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-16">
        {/* Gold accent blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #F5A623, transparent)" }}></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #F5A623, transparent)" }}></div>

        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left content */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border"
                style={{ background: "rgba(245,166,35,0.15)", borderColor: "rgba(245,166,35,0.3)" }}>
                <Crown className="w-4 h-4" style={{ color: "#F5A623" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#F5A623" }}>SVIP Membership</span>
              </div>

              <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, color: "#FFFFFF" }} className="mb-4">
                SVIP — Hành trình<br />
                <span style={{ color: "#F5A623" }}>sức khỏe cá nhân hóa</span>
              </h1>
              <p className="mb-8 max-w-lg" style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                Trải nghiệm trợ lý AI dinh dưỡng hoàn toàn cá nhân hóa — như có một chuyên gia dinh dưỡng riêng bên cạnh bạn mỗi ngày.
              </p>

              {/* Benefit pills */}
              <div className="flex flex-wrap gap-3 mb-10">
                {benefits.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div key={b.label} className="flex items-center gap-2 rounded-full px-4 py-2.5 border"
                      style={{ background: "rgba(245,166,35,0.1)", borderColor: "rgba(245,166,35,0.25)" }}>
                      <Icon className="w-4 h-4" style={{ color: "#F5A623" }} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#F5CA72" }}>{b.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Billing toggle */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                  <button
                    onClick={() => setBilling("monthly")}
                    className="px-5 py-2.5 transition-all"
                    style={{
                      fontSize: "0.875rem", fontWeight: 600,
                      background: billing === "monthly" ? "rgba(245,166,35,0.2)" : "transparent",
                      color: billing === "monthly" ? "#F5A623" : "rgba(255,255,255,0.5)",
                      borderRight: "1px solid rgba(255,255,255,0.15)"
                    }}
                  >
                    Hàng tháng
                  </button>
                  <button
                    onClick={() => setBilling("annual")}
                    className="px-5 py-2.5 transition-all flex items-center gap-2"
                    style={{
                      fontSize: "0.875rem", fontWeight: 600,
                      background: billing === "annual" ? "rgba(245,166,35,0.2)" : "transparent",
                      color: billing === "annual" ? "#F5A623" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    Hàng năm
                    {billing === "annual" && (
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">-20%</span>
                    )}
                  </button>
                </div>
                {billing === "annual" && (
                  <div className="rounded-full px-3 py-1" style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", fontSize: "0.8rem", fontWeight: 600 }}>
                    Tiết kiệm {((monthlyPrice - annualMonthlyPrice) * 12).toLocaleString("vi-VN")}₫/năm
                  </div>
                )}
              </div>

              {/* Price display */}
              <div className="flex items-end gap-2 mb-8">
                <span style={{ fontSize: "3.5rem", fontWeight: 900, color: "#F5A623", lineHeight: 1 }}>
                  {billing === "annual" ? annualMonthlyPrice.toLocaleString("vi-VN") : monthlyPrice.toLocaleString("vi-VN")}₫
                </span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", marginBottom: "0.4rem" }}>/tháng</span>
                {billing === "annual" && (
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem", textDecoration: "line-through", marginBottom: "0.3rem" }}>
                    {monthlyPrice.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/checkout"
                  className="flex items-center gap-2 rounded-2xl px-8 py-4 transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #F5A623, #e8890d)", color: "white", fontSize: "1rem", fontWeight: 700, boxShadow: "0 8px 30px rgba(245,166,35,0.4)" }}
                >
                  <Crown className="w-5 h-5" />
                  Trở thành SVIP
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/pricing"
                  className="flex items-center gap-2 rounded-2xl px-6 py-4 border transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", fontWeight: 600 }}
                >
                  So sánh gói
                </Link>
              </div>
            </div>

            {/* Right: Membership Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative" style={{ width: "360px" }}>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-3xl blur-2xl opacity-40" style={{ background: "linear-gradient(135deg, #F5A623, #e8890d)", transform: "scale(0.95)" }}></div>

                {/* Card */}
                <div className="relative rounded-3xl p-8 border" style={{
                  background: "linear-gradient(145deg, #1a3d25, #0f2d1c)",
                  borderColor: "rgba(245,166,35,0.5)",
                  boxShadow: "0 0 40px rgba(245,166,35,0.2), inset 0 1px 0 rgba(245,166,35,0.3)"
                }}>
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.2)" }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="#F5A623"/><path d="M2 17l10 5 10-5" stroke="#F5A623" strokeWidth="2"/><path d="M2 12l10 5 10-5" stroke="#F5A623" strokeWidth="2"/></svg>
                      </div>
                      <span style={{ color: "#F5A623", fontWeight: 800, fontSize: "1rem" }}>NutriPath</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.4)" }}>
                      <Crown className="w-3.5 h-3.5" style={{ color: "#F5A623" }} />
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#F5A623", letterSpacing: "0.08em" }}>SVIP</span>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #F5A623, #e8890d)", fontSize: "1.3rem", fontWeight: 800 }}>
                      {previewMember.initials}
                    </div>
                    <div>
                      <p className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{previewMember.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span style={{ fontSize: "0.8rem", color: "#4ade80" }}>Active Member</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {[
                      { label: "Ngày thành viên", value: "127" },
                      { label: "Công thức đã lưu", value: "43" },
                      { label: "AI Conversations", value: "89" },
                      { label: "Calo theo dõi", value: "38.2k" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#F5A623" }}>{stat.value}</p>
                        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Member since */}
                  <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div>
                      <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>THÀNH VIÊN TỪ</p>
                      <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Tháng 3, 2026</p>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>HẾT HẠN</p>
                      <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Tháng 3, 2027</p>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 rounded-2xl px-4 py-2 shadow-xl" style={{ background: "linear-gradient(135deg, #F5A623, #e8890d)" }}>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-white" />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "white" }}>Premium AI Coach</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Detail */}
      <section className="py-16" style={{ background: "#0a2015" }}>
        <div className="max-w-[1440px] mx-auto px-8">
          <h2 className="text-center mb-12" style={{ fontSize: "2.2rem", fontWeight: 800, color: "white" }}>
            Mọi thứ bạn nhận được với <span style={{ color: "#F5A623" }}>SVIP</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {svipFeatures.map((feat) => (
              <div key={feat} className="flex items-center gap-3 rounded-2xl px-5 py-4" style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,166,35,0.2)" }}>
                  <Check className="w-3.5 h-3.5" style={{ color: "#F5A623" }} />
                </div>
                <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SVIP */}
      <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-[1440px] mx-auto px-8">
          <h2 className="text-center mb-12" style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>
            Tại sao chọn SVIP?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="rounded-3xl p-7 text-center" style={{ background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.2)" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(245,166,35,0.15)" }}>
                    <Icon className="w-7 h-7" style={{ color: "#F5A623" }} />
                  </div>
                  <h3 className="mb-3" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#F5A623" }}>{b.label}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16" style={{ background: "#0a2015" }}>
        <div className="max-w-[1440px] mx-auto px-8">
          <h2 className="text-center mb-12" style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>
            SVIP thực sự tạo ra sự khác biệt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${t.color}`} style={{ fontSize: "0.85rem", fontWeight: 800 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>{t.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#F5A623" }}>{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}>"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 text-center" style={{ borderTop: "1px solid rgba(245,166,35,0.2)" }}>
        <Crown className="w-12 h-12 mx-auto mb-6" style={{ color: "#F5A623" }} />
        <h2 className="mb-4" style={{ fontSize: "2.5rem", fontWeight: 800, color: "white" }}>
          Sẵn sàng nâng tầm sức khỏe?
        </h2>
        <p className="mb-8" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)" }}>
          Tham gia cộng đồng SVIP — trải nghiệm khác biệt hoàn toàn
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/checkout"
            className="flex items-center gap-2 rounded-2xl px-10 py-4 hover:brightness-110 transition-all"
            style={{ background: "linear-gradient(135deg, #F5A623, #e8890d)", color: "white", fontSize: "1.05rem", fontWeight: 700, boxShadow: "0 8px 30px rgba(245,166,35,0.4)" }}
          >
            <Crown className="w-5 h-5" />
            Trở thành SVIP ngay
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/pricing"
            className="flex items-center gap-2 rounded-2xl px-8 py-4 border transition-all"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", fontSize: "1rem", fontWeight: 600 }}
          >
            So sánh tất cả gói
          </Link>
        </div>
        <p className="mt-5" style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
          Hủy bất cứ lúc nào • SSL bảo mật • Hỗ trợ 24/7
        </p>
      </section>
    </div>
  );
}
