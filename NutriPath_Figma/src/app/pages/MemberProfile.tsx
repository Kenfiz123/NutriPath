import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Crown, Star, Check, Lock, Download, Calendar, BookOpen,
  MessageCircle, TrendingUp, Shield, Zap, Leaf, ChevronRight,
  Bell, Settings, LogOut, RefreshCw, ArrowUpCircle, Sparkles
} from "lucide-react";
import { getProfile, type Member, type Payment, type Plan } from "../api";

type Tier = "free" | "vip" | "svip";

const tierConfig = {
  free: {
    label: "FREE",
    icon: Leaf,
    cardBg: "bg-gradient-to-br from-gray-600 to-gray-800",
    badgeBg: "bg-gray-100 text-gray-700 border border-gray-200",
    accent: "text-gray-600",
    accentBg: "bg-gray-50",
    accentBorder: "border-gray-200",
    btnPrimary: "bg-gray-700 hover:bg-gray-800 text-white",
    progressColor: "bg-gray-500",
  },
  vip: {
    label: "VIP",
    icon: Star,
    cardBg: "bg-gradient-to-br from-green-600 to-emerald-700",
    badgeBg: "bg-green-100 text-green-700 border border-green-200",
    accent: "text-green-600",
    accentBg: "bg-green-50",
    accentBorder: "border-green-200",
    btnPrimary: "bg-green-600 hover:bg-green-700 text-white",
    progressColor: "bg-green-500",
  },
  svip: {
    label: "SVIP",
    icon: Crown,
    cardBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    badgeBg: "bg-amber-100 text-amber-700 border border-amber-200",
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    btnPrimary: "bg-amber-500 hover:bg-amber-600 text-white",
    progressColor: "bg-amber-500",
  },
};

const navItems = [
  { icon: TrendingUp, label: "Tổng quan", id: "overview" },
  { icon: Shield, label: "Gói thành viên", id: "membership" },
  { icon: BookOpen, label: "Hoạt động", id: "activity" },
  { icon: Bell, label: "Thông báo", id: "notifications" },
  { icon: Settings, label: "Cài đặt", id: "settings" },
];

function formatDate(date?: string | null) {
  if (!date) return "Không xác định";
  return new Date(date).toLocaleDateString("vi-VN");
}

function formatMoney(amount: number, currency = "VND") {
  return amount.toLocaleString("vi-VN") + (currency === "VND" ? "₫" : ` ${currency}`);
}

export function MemberProfile() {
  const [member, setMember] = useState<Member | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [benefits, setBenefits] = useState<Plan["features"]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeNav, setActiveNav] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((data) => {
        setMember(data.member);
        setPlan(data.plan);
        setBenefits(data.benefits);
        setPayments(data.billingHistory);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được hồ sơ thành viên"));
  }, []);

  if (error) {
    return <div className="min-h-screen bg-gray-50 p-8 text-red-600">{error}</div>;
  }

  if (!member) {
    return <div className="min-h-screen bg-gray-50 p-8 text-gray-500">Đang tải hồ sơ thành viên...</div>;
  }

  const tier = member.tier as Tier;
  const config = tierConfig[tier] ?? tierConfig.free;
  const TierIcon = config.icon;
  const stats = member.stats ?? { memberDays: 0, savedRecipes: 0, aiConversations: 0, trackedCalories: 0, streakDays: 0 };
  const progress = member.subscription?.daysTotal && member.subscription?.daysRemaining
    ? Math.round((member.subscription.daysRemaining / member.subscription.daysTotal) * 100)
    : 0;

  const statCards = [
    { icon: Calendar, label: "Ngày thành viên", value: stats.memberDays.toLocaleString("vi-VN"), unit: "ngày", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: BookOpen, label: "Công thức đã lưu", value: stats.savedRecipes.toLocaleString("vi-VN"), unit: "công thức", color: "text-orange-600", bg: "bg-orange-50" },
    { icon: MessageCircle, label: "AI Conversations", value: stats.aiConversations.toLocaleString("vi-VN"), unit: "cuộc hội thoại", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: TrendingUp, label: "Calo đã theo dõi", value: stats.trackedCalories.toLocaleString("vi-VN"), unit: "kcal tổng", color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className={`${config.cardBg} rounded-3xl p-6 text-white`}>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-3 text-white" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{member.initials}</div>
                <h3 className="text-white mb-1" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{member.name}</h3>
                <p className="text-white/70 mb-3" style={{ fontSize: "0.8rem" }}>{member.email}</p>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tier === "svip" ? "bg-amber-900/30 border border-amber-300/30" : "bg-white/20"}`}>
                  <TierIcon className="w-3.5 h-3.5 text-white" />
                  <span className="text-white" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{config.label} Member</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
              {navItems.map(({ icon: Icon, label, id }) => (
                <button key={id} onClick={() => setActiveNav(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeNav === id ? `${config.accentBg} ${config.accent}` : "text-gray-600 hover:bg-gray-50"}`}>
                  <Icon className="w-4 h-4" />
                  <span style={{ fontSize: "0.875rem", fontWeight: activeNav === id ? 600 : 400 }}>{label}</span>
                  {activeNav === id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all">
                  <LogOut className="w-4 h-4" />
                  <span style={{ fontSize: "0.875rem" }}>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className={`${config.cardBg} rounded-3xl p-8 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TierIcon className="w-5 h-5 text-white" />
                      <span className="text-white/80" style={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.08em" }}>{config.label} MEMBERSHIP</span>
                    </div>
                    <h2 className="text-white mb-1" style={{ fontSize: "1.8rem", fontWeight: 800 }}>{member.name}</h2>
                    <p className="text-white/70" style={{ fontSize: "0.875rem" }}>Thành viên từ: {formatDate(member.joinedAt)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                      <span className="text-green-200" style={{ fontSize: "0.8rem" }}>
                        {member.subscription?.status ?? "active"} · Hết hạn: {formatDate(member.subscription?.renewsAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      <RefreshCw className="w-4 h-4" />
                      Gia hạn
                    </button>
                    {tier !== "svip" && (
                      <Link to="/svip" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-5 py-2.5 rounded-xl transition-all" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        <Crown className="w-4 h-4" />
                        Lên SVIP
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/70" style={{ fontSize: "0.8rem" }}>Thời gian còn lại</span>
                    <span className="text-white" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      {member.subscription?.daysRemaining ?? 0}/{member.subscription?.daysTotal ?? 0} ngày
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map(({ icon: Icon, label, value, unit, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-gray-900" style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 }}>{value}</p>
                  <p className="text-gray-500 mt-1" style={{ fontSize: "0.75rem" }}>{unit}</p>
                  <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.72rem" }}>{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Quyền lợi của bạn</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${config.badgeBg}`}>{plan?.name ?? config.label}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {benefits.map((benefit, index) => {
                  const icons = [Zap, BookOpen, MessageCircle, Crown, Sparkles, Shield];
                  const Icon = icons[index % icons.length];
                  return (
                    <div key={benefit.label} className={`rounded-2xl p-4 border transition-all ${benefit.included ? `${config.accentBg} ${config.accentBorder} border` : "bg-gray-50 border-gray-200 opacity-60"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${benefit.included ? "bg-white shadow-sm" : "bg-gray-200"}`}>
                          <Icon className={`w-4 h-4 ${benefit.included ? config.accent : "text-gray-400"}`} />
                        </div>
                        {benefit.included ? <Check className={`w-4 h-4 ${config.accent}`} /> : <Lock className="w-4 h-4 text-gray-400" />}
                      </div>
                      <p className={benefit.included ? "text-gray-900" : "text-gray-400"} style={{ fontSize: "0.875rem", fontWeight: 600 }}>{benefit.label}</p>
                    </div>
                  );
                })}
              </div>
              {tier !== "svip" && (
                <div className={`mt-4 rounded-2xl p-4 flex items-center justify-between border ${config.accentBorder} ${config.accentBg}`}>
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-gray-900" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Nâng lên SVIP để mở khóa AI Coach & thêm quyền lợi</p>
                      <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>Dữ liệu gói sẽ được lấy từ backend khi checkout</p>
                    </div>
                  </div>
                  <Link to="/svip" className="flex items-center gap-1 bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-all flex-shrink-0" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                    Nâng cấp <ArrowUpCircle className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Lịch sử thanh toán</h3>
                <button className={`${config.accent} hover:underline`} style={{ fontSize: "0.875rem", fontWeight: 600 }}>Xem tất cả</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Ngày", "Gói", "Số tiền", "Trạng thái", "Hóa đơn"].map((header) => (
                        <th key={header} className="text-left py-3 text-gray-500" style={{ fontSize: "0.78rem", fontWeight: 600 }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 text-gray-600" style={{ fontSize: "0.875rem" }}>{formatDate(payment.paidAt)}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${payment.planId === "svip" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>{payment.planId.toUpperCase()}</span>
                        </td>
                        <td className="py-3.5 text-gray-900" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{formatMoney(payment.amount, payment.currency)}</td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-green-700" style={{ fontSize: "0.8rem" }}>{payment.status}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            <span style={{ fontSize: "0.8rem" }}>{payment.invoice}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
