import { Link } from "react-router";
import {
  Leaf, ArrowRight, Calculator, MessageCircle, BookOpen, UtensilsCrossed,
  CheckCircle, Zap, TrendingUp, ChevronRight, Play, Check,
  Crown, Star, Sparkles, Shield, Bot, Unlock, Gift, Users
} from "lucide-react";

const heroImg = "https://images.unsplash.com/photo-1719677775416-1dd6a93f1a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMGNvbG9yZnVsJTIwYm93bHMlMjBudXRyaXRpb258ZW58MXx8fHwxNzczNDA4NTU3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const smoothieImg = "https://images.unsplash.com/photo-1594916107106-4837e3ed0e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHNtb290aGllJTIwYm93bCUyMGJyZWFrZmFzdCUyMGhlYWx0aHl8ZW58MXx8fHwxNzczNDA4NTU3fDA&ixlib=rb-4.1.0&q=80&w=400";
const chickenImg = "https://images.unsplash.com/photo-1760888549075-0b9727e07735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMHNhbGFkJTIwcHJvdGVpbiUyMG1lYWx8ZW58MXx8fHwxNzczNDA4NTU3fDA&ixlib=rb-4.1.0&q=80&w=400";

const features = [
  {
    icon: Calculator,
    title: "Tính Calo Thông Minh",
    desc: "Tính BMR, TDEE và nhu cầu dinh dưỡng cá nhân hóa theo mục tiêu của bạn",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    preview: (
      <div className="mt-3 bg-white rounded-xl p-3 border border-blue-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500" style={{ fontSize: "0.75rem" }}>TDEE hôm nay</span>
          <span className="text-blue-600" style={{ fontSize: "0.75rem", fontWeight: 600 }}>2,150 kcal</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "67%" }}></div>
        </div>
        <div className="flex justify-between">
          <div className="text-center">
            <div className="text-blue-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>P: 30%</div>
          </div>
          <div className="text-center">
            <div className="text-blue-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>C: 50%</div>
          </div>
          <div className="text-center">
            <div className="text-blue-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>F: 20%</div>
          </div>
        </div>
      </div>
    ),
    link: "/calculator",
  },
  {
    icon: MessageCircle,
    title: "AI Chatbot Dinh Dưỡng",
    desc: "Trò chuyện với AI chuyên gia 24/7, nhận tư vấn dinh dưỡng cá nhân hóa tức thì",
    color: "bg-green-50",
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    preview: (
      <div className="mt-3 space-y-2">
        <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 border border-gray-100 text-gray-700 w-fit" style={{ fontSize: "0.78rem" }}>
          Tôi muốn ăn gì tốt cho sức khỏe? 🥗
        </div>
        <div className="bg-green-600 rounded-2xl rounded-tr-sm px-3 py-2 text-white ml-auto w-fit" style={{ fontSize: "0.78rem" }}>
          Gợi ý: Cháo gà + rau muống xào... ✨
        </div>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></span>
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
      </div>
    ),
    link: "/dashboard",
  },
  {
    icon: BookOpen,
    title: "Kho Công Thức Healthy",
    desc: "Hàng trăm công thức nấu ăn lành mạnh với hướng dẫn chi tiết từng bước",
    color: "bg-orange-50",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    preview: (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl overflow-hidden">
          <img src={smoothieImg} alt="recipe" className="w-full h-16 object-cover" />
          <div className="bg-white px-2 py-1 border border-orange-100">
            <p className="text-gray-700 truncate" style={{ fontSize: "0.7rem", fontWeight: 500 }}>Cháo Gà Gừng</p>
            <p className="text-orange-500" style={{ fontSize: "0.65rem" }}>280 kcal</p>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden">
          <img src={chickenImg} alt="recipe" className="w-full h-16 object-cover" />
          <div className="bg-white px-2 py-1 border border-orange-100">
            <p className="text-gray-700 truncate" style={{ fontSize: "0.7rem", fontWeight: 500 }}>Cơm Tấm Sườn Nướng</p>
            <p className="text-orange-500" style={{ fontSize: "0.65rem" }}>450 kcal</p>
          </div>
        </div>
      </div>
    ),
    link: "/recipes",
  },
  {
    icon: UtensilsCrossed,
    title: "Nhật Ký Bữa Ăn",
    desc: "Ghi lại từng bữa ăn, theo dõi calo và dinh dưỡng hàng ngày dễ dàng",
    color: "bg-purple-50",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    preview: (
      <div className="mt-3 space-y-1.5">
        {[
          { meal: "Bữa sáng", kcal: 450, color: "bg-yellow-400", pct: 56 },
          { meal: "Bữa trưa", kcal: 620, color: "bg-green-400", pct: 77 },
          { meal: "Bữa tối", kcal: 0, color: "bg-gray-200", pct: 0 },
        ].map((item) => (
          <div key={item.meal} className="flex items-center gap-2">
            <span className="text-gray-600 w-20" style={{ fontSize: "0.72rem" }}>{item.meal}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${item.pct}%` }}></div>
            </div>
            <span className="text-gray-500 w-14 text-right" style={{ fontSize: "0.72rem" }}>{item.kcal > 0 ? `${item.kcal} kcal` : "—"}</span>
          </div>
        ))}
      </div>
    ),
    link: "/tracker",
  },
];

const steps = [
  {
    number: "01",
    title: "Tạo hồ sơ sức khỏe",
    desc: "Nhập thông tin cơ bản: chiều cao, cân nặng, tuổi và mục tiêu sức khỏe của bạn.",
    color: "bg-green-600",
  },
  {
    number: "02",
    title: "AI phân tích & tư vấn",
    desc: "Hệ thống AI tính toán nhu cầu dinh dưỡng và lên kế hoạch ăn uống phù hợp.",
    color: "bg-emerald-500",
  },
  {
    number: "03",
    title: "Theo dõi & cải thiện",
    desc: "Ghi lại bữa ăn hàng ngày và nhận báo cáo tiến trình chi tiết mỗi tuần.",
    color: "bg-teal-500",
  },
];

const membershipTiers = [
  {
    id: "free",
    badge: "Miễn phí",
    name: "Free",
    tagline: "Bắt đầu hành trình sức khỏe",
    price: "0₫",
    period: "",
    color: "bg-white",
    border: "border-gray-200",
    headerBg: "bg-gray-50",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
    icon: Leaf,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    accentColor: "#16a34a",
    highlights: [
      { icon: Calculator, text: "Tính calo & BMR cơ bản" },
      { icon: BookOpen, text: "50+ công thức món Việt" },
      { icon: UtensilsCrossed, text: "Nhật ký bữa ăn cơ bản" },
    ],
    cta: "Dùng miễn phí",
    ctaStyle: "border-2 border-green-600 text-green-700 hover:bg-green-50",
    link: "/dashboard",
    popular: false,
    ribbon: null,
  },
  {
    id: "vip",
    badge: "Phổ biến nhất",
    name: "VIP",
    tagline: "Cho người nghiêm túc với sức khỏe",
    price: "299,000₫",
    period: "/tháng",
    color: "bg-white",
    border: "border-green-500",
    headerBg: "bg-gradient-to-br from-green-600 to-emerald-500",
    badgeBg: "bg-green-500",
    badgeText: "text-white",
    icon: Crown,
    iconBg: "bg-white/20",
    iconColor: "text-white",
    accentColor: "#16a34a",
    highlights: [
      { icon: Bot, text: "AI chatbot dinh dưỡng 24/7" },
      { icon: BookOpen, text: "200+ công thức độc quyền" },
      { icon: TrendingUp, text: "Báo cáo tiến trình chi tiết" },
    ],
    cta: "Nâng cấp VIP",
    ctaStyle: "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200",
    link: "/pricing",
    popular: true,
    ribbon: "🔥 PHỔ BIẾN",
  },
  {
    id: "svip",
    badge: "Cao cấp nhất",
    name: "SVIP",
    tagline: "Trải nghiệm đỉnh cao, không giới hạn",
    price: "499,000₫",
    period: "/tháng",
    color: "bg-[#0a1628]",
    border: "border-yellow-500/60",
    headerBg: "bg-gradient-to-br from-[#0f2040] to-[#1a3560]",
    badgeBg: "bg-gradient-to-r from-yellow-500 to-amber-400",
    badgeText: "text-white",
    icon: Sparkles,
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    accentColor: "#f59e0b",
    highlights: [
      { icon: Shield, text: "Tư vấn 1-1 chuyên gia dinh dưỡng" },
      { icon: Sparkles, text: "AI cá nhân hóa tuyệt đối" },
      { icon: Unlock, text: "Toàn bộ tính năng không giới hạn" },
    ],
    cta: "Khám phá SVIP",
    ctaStyle: "bg-gradient-to-r from-yellow-500 to-amber-400 text-white hover:from-yellow-400 hover:to-amber-300 shadow-lg shadow-yellow-200/30",
    link: "/svip",
    popular: false,
    ribbon: "⭐ PREMIUM",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 30%, #059669 65%, #0d9488 100%)" }}
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="absolute top-28 right-[10%] bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 hidden lg:flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-300" />
          <span className="text-white" style={{ fontSize: "0.8rem", fontWeight: 500 }}>AI Powered Nutrition</span>
        </div>

        <div className="max-w-[1440px] mx-auto px-8 pt-16 pb-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <Leaf className="w-4 h-4 text-green-300" />
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Trợ lý dinh dưỡng AI #1 Việt Nam</span>
              </div>
              <h1
                className="text-white mb-4"
                style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", fontWeight: 800, lineHeight: 1.15 }}
              >
                Ăn Healthy —<br />
                <span className="text-green-200">Sống Khỏe</span> Mỗi Ngày
              </h1>
              <p className="text-green-100 mb-8 max-w-lg" style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>
                NutriPath là trợ lý dinh dưỡng thông minh giúp bạn tính toán calo, lên kế hoạch bữa ăn và đạt mục tiêu sức khỏe với sự hỗ trợ của trí tuệ nhân tạo.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 bg-white text-green-700 px-8 py-3.5 rounded-2xl hover:bg-green-50 transition-all shadow-xl"
                  style={{ fontSize: "1rem", fontWeight: 700 }}
                >
                  Bắt Đầu Miễn Phí
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="flex items-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3.5 rounded-2xl hover:bg-white/20 transition-all">
                  <Play className="w-5 h-5" />
                  <span style={{ fontSize: "1rem", fontWeight: 500 }}>Xem Demo</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {["Dùng thử 14 ngày miễn phí", "Không cần thẻ tín dụng", "Hủy bất cứ lúc nào"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-green-200">
                    <CheckCircle className="w-4 h-4 text-green-300" />
                    <span style={{ fontSize: "0.875rem" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative mx-auto" style={{ maxWidth: "520px" }}>
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <img src={heroImg} alt="Healthy food bowls" className="w-full h-80 object-cover" />
                </div>
                <div className="absolute -left-8 top-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-500" style={{ fontSize: "0.72rem" }}>Tiến trình tuần này</p>
                    <p className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>-0.8 kg 🎉</p>
                  </div>
                </div>
                <div className="absolute -right-6 bottom-12 bg-white rounded-2xl shadow-xl p-4">
                  <p className="text-gray-500 mb-1" style={{ fontSize: "0.72rem" }}>Hôm nay</p>
                  <div className="flex items-end gap-1">
                    <span className="text-green-600" style={{ fontSize: "1.4rem", fontWeight: 800 }}>1,340</span>
                    <span className="text-gray-400 mb-0.5" style={{ fontSize: "0.8rem" }}>/ 1,800 kcal</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "74%" }}></div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full border-4 border-dashed border-white/20"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 80L1440 80L1440 30C1200 70 960 10 720 40C480 70 240 0 0 30L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 rounded-full px-4 py-1.5 mb-4" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Tính năng nổi bật</span>
            <h2 className="text-gray-900 mb-4" style={{ fontSize: "2.2rem", fontWeight: 800 }}>Mọi thứ bạn cần để<br /><span className="text-green-600">sống khỏe hơn</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
              Từ tính toán dinh dưỡng đến gợi ý công thức — NutriPath là người bạn đồng hành hoàn hảo trên hành trình sức khỏe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color, iconColor, iconBg, preview, link }) => (
              <Link
                to={link}
                key={title}
                className={`${color} rounded-3xl p-6 hover:shadow-xl transition-all hover:-translate-y-1 border border-white group`}
              >
                <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="text-gray-900 mb-2" style={{ fontSize: "1.05rem", fontWeight: 700 }}>{title}</h3>
                <p className="text-gray-500" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>{desc}</p>
                {preview}
                <div className={`mt-4 flex items-center gap-1 ${iconColor} group-hover:gap-2 transition-all`} style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Khám phá ngay <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 rounded-full px-4 py-1.5 mb-4" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Cách thức hoạt động</span>
            <h2 className="text-gray-900" style={{ fontSize: "2.2rem", fontWeight: 800 }}>Bắt đầu chỉ trong <span className="text-green-600">3 bước đơn giản</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-2/3 w-1/2 h-px bg-green-100 z-0" style={{ transform: "translateX(-10%)" }}></div>
                )}
                <div className={`relative z-10 w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                  <span className="text-white" style={{ fontSize: "1.3rem", fontWeight: 800 }}>{step.number}</span>
                </div>
                <h3 className="text-gray-900 mb-3" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{step.title}</h3>
                <p className="text-gray-500 mx-auto max-w-xs" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIP SECTION — replaces PRICING PLANS */}
      <section className="bg-gray-50 py-20 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-100/60 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-8 relative">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 mb-4" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              <Users className="w-4 h-4" />
              Hệ thống thành viên
            </span>
            <h2 className="text-gray-900 mb-4" style={{ fontSize: "2.2rem", fontWeight: 800 }}>
              Chọn hành trình <span className="text-green-600">phù hợp</span> với bạn
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
              Từ người mới bắt đầu đến chuyên gia sức khỏe — NutriPath có gói thành viên dành riêng cho mọi mục tiêu và lối sống.
            </p>
          </div>

          {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {membershipTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative ${tier.color} border-2 ${tier.border} rounded-3xl overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl group`}
                style={{ boxShadow: tier.popular ? "0 8px 40px rgba(22,163,74,0.15)" : tier.id === "svip" ? "0 8px 40px rgba(245,158,11,0.12)" : undefined }}
              >
                {/* Ribbon */}
                {tier.ribbon && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`${tier.badgeBg} ${tier.badgeText} px-3 py-1 rounded-full`} style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                      {tier.ribbon}
                    </span>
                  </div>
                )}

                {/* Card Header */}
                <div className={`${tier.headerBg} p-7 pb-8`}>
                  <div className={`w-12 h-12 ${tier.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                    <tier.icon className={`w-6 h-6 ${tier.iconColor}`} />
                  </div>
                  <div className="mb-1">
                    <span className={`inline-block ${tier.id === "vip" ? "bg-white/20 text-white" : tier.id === "svip" ? "bg-yellow-500/20 text-yellow-300" : "bg-green-100 text-green-600"} px-2.5 py-0.5 rounded-full`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      {tier.badge}
                    </span>
                  </div>
                  <h3
                    className={tier.id === "vip" ? "text-white" : tier.id === "svip" ? "text-white" : "text-gray-900"}
                    style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.02em" }}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={tier.id === "vip" ? "text-green-100" : tier.id === "svip" ? "text-slate-400" : "text-gray-500"}
                    style={{ fontSize: "0.85rem", marginTop: "4px" }}
                  >
                    {tier.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-5 flex items-end gap-1">
                    <span
                      className={tier.id === "vip" ? "text-white" : tier.id === "svip" ? "text-yellow-300" : "text-gray-900"}
                      style={{ fontSize: tier.id === "free" ? "1.8rem" : "2rem", fontWeight: 800, lineHeight: 1 }}
                    >
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span
                        className={tier.id === "vip" ? "text-green-200" : tier.id === "svip" ? "text-slate-400" : "text-gray-400"}
                        style={{ fontSize: "0.85rem", marginBottom: "3px" }}
                      >
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Highlights */}
                <div className="p-7">
                  <p
                    className={tier.id === "svip" ? "text-slate-400" : "text-gray-400"}
                    style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}
                  >
                    Tính năng nổi bật
                  </p>
                  <ul className="space-y-3 mb-7">
                    {tier.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${tier.accentColor}18` }}
                        >
                          <h.icon className="w-3.5 h-3.5" style={{ color: tier.accentColor }} />
                        </div>
                        <span
                          className={tier.id === "svip" ? "text-slate-300" : "text-gray-700"}
                          style={{ fontSize: "0.875rem" }}
                        >
                          {h.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Feature count teaser */}
                  <div
                    className="flex items-center gap-2 mb-6 py-2.5 px-3.5 rounded-xl"
                    style={{ backgroundColor: `${tier.accentColor}10`, border: `1px solid ${tier.accentColor}20` }}
                  >
                    <Gift className="w-4 h-4 flex-shrink-0" style={{ color: tier.accentColor }} />
                    <span style={{ fontSize: "0.8rem", color: tier.accentColor, fontWeight: 600 }}>
                      {tier.id === "free" && "Và nhiều tính năng miễn phí khác"}
                      {tier.id === "vip" && "15+ tính năng nâng cao độc quyền"}
                      {tier.id === "svip" && "Toàn bộ tính năng + ưu tiên tuyệt đối"}
                    </span>
                  </div>

                  <Link
                    to={tier.link}
                    className={`w-full flex items-center justify-center gap-2 ${tier.ctaStyle} px-6 py-3.5 rounded-2xl transition-all`}
                    style={{ fontSize: "0.95rem", fontWeight: 700 }}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA strip */}
          <div className="rounded-3xl p-8 border border-green-200 bg-gradient-to-r from-green-50 via-white to-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 700 }}>Chưa chắc chắn gói nào phù hợp?</p>
                <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>So sánh đầy đủ tính năng và lợi ích của từng gói thành viên</p>
              </div>
            </div>
            <Link
              to="/pricing"
              className="flex-shrink-0 flex items-center gap-2 bg-green-600 text-white px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
              style={{ fontSize: "0.95rem", fontWeight: 700 }}
            >
              So sánh tất cả gói
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #15803d 0%, #059669 50%, #0d9488 100%)" }}>
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-white mb-4" style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.2 }}>
              Bắt đầu hành trình<br />sống khỏe ngay hôm nay!
            </h2>
            <p className="text-green-100 mb-8" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
              Tham gia NutriPath ngay hôm nay và trải nghiệm 14 ngày miễn phí!
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-green-700 px-10 py-4 rounded-2xl hover:bg-green-50 transition-all shadow-xl"
              style={{ fontSize: "1.05rem", fontWeight: 700 }}
            >
              Dùng Thử Miễn Phí
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-green-200 mt-4" style={{ fontSize: "0.85rem" }}>Dùng thử 14 ngày • Không cần thẻ tín dụng</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>NutriPath</span>
            </div>
            <p style={{ fontSize: "0.875rem" }}>© 2026 NutriPath. Tất cả quyền được bảo lưu.</p>
            <div className="flex gap-6">
              {["Điều khoản", "Bảo mật", "Liên hệ"].map((item) => (
                <button key={item} className="hover:text-white transition-colors" style={{ fontSize: "0.875rem" }}>{item}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}