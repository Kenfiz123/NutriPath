import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowUpCircle,
  Bell,
  BookOpen,
  Calendar,
  Check,
  Crown,
  Download,
  Leaf,
  Lock,
  LogOut,
  MessageCircle,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  getProfile,
  syncStoredMember,
  updateMemberProfile,
  type Member,
  type Payment,
  type Plan,
} from "../api";
import { useAuth } from "../auth";

type Tier = "free" | "vip" | "svip";
type ProfileTab = "overview" | "membership" | "activity" | "notifications" | "settings";

const tierConfig = {
  free: {
    label: "FREE",
    icon: Leaf,
    cardBg: "bg-gradient-to-br from-gray-600 to-gray-800",
    badgeBg: "bg-gray-100 text-gray-700 border border-gray-200",
    accent: "text-gray-600",
    accentBg: "bg-gray-50",
    accentBorder: "border-gray-200",
  },
  vip: {
    label: "VIP",
    icon: Star,
    cardBg: "bg-gradient-to-br from-green-600 to-emerald-700",
    badgeBg: "bg-green-100 text-green-700 border border-green-200",
    accent: "text-green-600",
    accentBg: "bg-green-50",
    accentBorder: "border-green-200",
  },
  svip: {
    label: "SVIP",
    icon: Crown,
    cardBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    badgeBg: "bg-amber-100 text-amber-700 border border-amber-200",
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
  },
};

const navItems: Array<{ icon: typeof TrendingUp; label: string; id: ProfileTab }> = [
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
  return amount.toLocaleString("vi-VN") + (currency === "VND" ? "đ" : ` ${currency}`);
}

function makeInvoiceFile(payment: Payment) {
  return [
    "NutriPath Invoice",
    `Mã hóa đơn: ${payment.invoice}`,
    `Gói: ${payment.planId.toUpperCase()}`,
    `Chu kỳ: ${payment.billing}`,
    `Số tiền: ${formatMoney(payment.amount, payment.currency)}`,
    `Trạng thái: ${payment.status}`,
    `Ngày thanh toán: ${formatDate(payment.paidAt)}`,
  ].join("\n");
}

export function MemberProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [benefits, setBenefits] = useState<Plan["features"]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeNav, setActiveNav] = useState<ProfileTab>("overview");
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    email: "",
    calorieTarget: 1800,
    waterTargetGlasses: 8,
  });

  useEffect(() => {
    getProfile()
      .then((data) => {
        setMember(data.member);
        setPlan(data.plan);
        setBenefits(data.benefits);
        setPayments(data.billingHistory);
        setSettingsForm({
          name: data.member.name,
          email: data.member.email,
          calorieTarget: data.member.calorieTarget,
          waterTargetGlasses: data.member.waterTargetGlasses,
        });
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được hồ sơ thành viên"));
  }, []);

  const notifications = useMemo(() => {
    if (!member) return [];
    const nextPayments = [...payments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    return [
      {
        title: "Mục tiêu dinh dưỡng",
        text: `Mục tiêu hiện tại: ${member.calorieTarget.toLocaleString("vi-VN")} kcal/ngày, ${member.waterTargetGlasses} ly nước/ngày.`,
      },
      {
        title: "Gói thành viên",
        text: member.subscription?.daysRemaining
          ? `Gói ${member.tier.toUpperCase()} còn ${member.subscription.daysRemaining} ngày sử dụng.`
          : `Bạn đang ở gói ${member.tier.toUpperCase()}.`,
      },
      {
        title: "Thanh toán gần nhất",
        text: nextPayments[0]
          ? `${nextPayments[0].invoice} - ${formatMoney(nextPayments[0].amount, nextPayments[0].currency)} ngày ${formatDate(nextPayments[0].paidAt)}.`
          : "Chưa có hóa đơn thanh toán nào.",
      },
    ];
  }, [member, payments]);

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
  const visiblePayments = showAllPayments ? payments : payments.slice(0, 4);

  const statCards = [
    { icon: Calendar, label: "Ngày thành viên", value: stats.memberDays.toLocaleString("vi-VN"), unit: "ngày", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: BookOpen, label: "Công thức đã lưu", value: stats.savedRecipes.toLocaleString("vi-VN"), unit: "công thức", color: "text-orange-600", bg: "bg-orange-50" },
    { icon: MessageCircle, label: "AI Conversations", value: stats.aiConversations.toLocaleString("vi-VN"), unit: "cuộc hội thoại", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: TrendingUp, label: "Calo đã theo dõi", value: stats.trackedCalories.toLocaleString("vi-VN"), unit: "kcal tổng", color: "text-green-600", bg: "bg-green-50" },
  ];

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function handleDownloadInvoice(payment: Payment) {
    const blob = new Blob([makeInvoiceFile(payment)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${payment.invoice}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const calorieTarget = Number(settingsForm.calorieTarget);
    const waterTargetGlasses = Number(settingsForm.waterTargetGlasses);

    if (!settingsForm.name.trim() || !settingsForm.email.trim()) {
      setStatusMessage("Tên và email không được để trống.");
      return;
    }
    if (calorieTarget < 1200 || calorieTarget > 5000) {
      setStatusMessage("Mục tiêu calo nên nằm trong khoảng 1200-5000 kcal/ngày.");
      return;
    }
    if (waterTargetGlasses < 1 || waterTargetGlasses > 20) {
      setStatusMessage("Mục tiêu nước nên nằm trong khoảng 1-20 ly/ngày.");
      return;
    }

    setSavingSettings(true);
    try {
      const updated = await updateMemberProfile({
        name: settingsForm.name.trim(),
        email: settingsForm.email.trim(),
        calorieTarget,
        waterTargetGlasses,
      });
      setMember(updated);
      syncStoredMember(updated);
      setStatusMessage("Đã lưu cài đặt hồ sơ.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Không lưu được cài đặt hồ sơ.");
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="space-y-4 lg:col-span-1">
            <div className={`${config.cardBg} rounded-3xl p-6 text-white`}>
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-white" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{member.initials}</div>
                <h3 className="mb-1 text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{member.name}</h3>
                <p className="mb-3 text-white/70" style={{ fontSize: "0.8rem" }}>{member.email}</p>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${tier === "svip" ? "bg-amber-900/30 border border-amber-300/30" : "bg-white/20"}`}>
                  <TierIcon className="h-3.5 w-3.5 text-white" />
                  <span className="text-white" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{config.label} Member</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
              {navItems.map(({ icon: Icon, label, id }) => (
                <button key={id} onClick={() => setActiveNav(id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${activeNav === id ? `${config.accentBg} ${config.accent}` : "text-gray-600 hover:bg-gray-50"}`}>
                  <Icon className="h-4 w-4" />
                  <span style={{ fontSize: "0.875rem", fontWeight: activeNav === id ? 600 : 400 }}>{label}</span>
                </button>
              ))}
              <div className="mt-2 border-t border-gray-100 pt-2">
                <button onClick={() => void handleLogout()} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-500 transition-all hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  <span style={{ fontSize: "0.875rem" }}>Đăng xuất</span>
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-6 lg:col-span-3">
            <section className={`${config.cardBg} relative overflow-hidden rounded-3xl p-8 text-white`}>
              <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/4 rounded-full bg-white/5" />
              <div className="relative z-10">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <TierIcon className="h-5 w-5 text-white" />
                      <span className="text-white/80" style={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.08em" }}>{config.label} MEMBERSHIP</span>
                    </div>
                    <h2 className="mb-1 text-white" style={{ fontSize: "1.8rem", fontWeight: 800 }}>{member.name}</h2>
                    <p className="text-white/70" style={{ fontSize: "0.875rem" }}>Thành viên từ: {formatDate(member.joinedAt)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-300" />
                      <span className="text-green-200" style={{ fontSize: "0.8rem" }}>
                        {member.subscription?.status ?? "active"} · Hết hạn: {formatDate(member.subscription?.renewsAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to={`/checkout?plan=${tier === "svip" ? "svip" : "vip"}&billing=monthly`} className="flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-white transition-all hover:bg-white/30" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      <RefreshCw className="h-4 w-4" />
                      Gia hạn
                    </Link>
                    {tier !== "svip" && (
                      <Link to="/svip" className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-white transition-all hover:bg-amber-400" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        <Crown className="h-4 w-4" />
                        Lên SVIP
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between">
                    <span className="text-white/70" style={{ fontSize: "0.8rem" }}>Thời gian còn lại</span>
                    <span className="text-white" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      {member.subscription?.daysRemaining ?? 0}/{member.subscription?.daysTotal ?? 0} ngày
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/20">
                    <div className="h-2 rounded-full bg-white" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </section>

            {activeNav === "overview" && (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {statCards.map(({ icon: Icon, label, value, unit, color, bg }) => (
                    <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <p className="text-gray-900" style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 }}>{value}</p>
                      <p className="mt-1 text-gray-500" style={{ fontSize: "0.75rem" }}>{unit}</p>
                      <p className="mt-0.5 text-gray-400" style={{ fontSize: "0.72rem" }}>{label}</p>
                    </div>
                  ))}
                </div>
                <ProfileBenefits plan={plan} benefits={benefits} tier={tier} config={config} />
              </>
            )}

            {activeNav === "membership" && (
              <>
                <ProfileBenefits plan={plan} benefits={benefits} tier={tier} config={config} />
                <PaymentHistory payments={visiblePayments} showAll={showAllPayments} onToggle={() => setShowAllPayments((value) => !value)} onDownload={handleDownloadInvoice} />
              </>
            )}

            {activeNav === "activity" && (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {statCards.map(({ icon: Icon, label, value, unit, color, bg }) => (
                    <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <p className="text-gray-900" style={{ fontSize: "1.35rem", fontWeight: 800 }}>{value}</p>
                      <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>{label} · {unit}</p>
                    </div>
                  ))}
                </div>
                <PaymentHistory payments={visiblePayments} showAll={showAllPayments} onToggle={() => setShowAllPayments((value) => !value)} onDownload={handleDownloadInvoice} />
              </>
            )}

            {activeNav === "notifications" && (
              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Thông báo của bạn</h3>
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{item.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeNav === "settings" && (
              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-1 text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Cài đặt hồ sơ</h3>
                <p className="mb-5 text-sm text-gray-500">Các thay đổi được lưu vào backend và đồng bộ lại toàn app.</p>
                <form onSubmit={(event) => void handleSaveSettings(event)} className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-gray-700">Họ tên</span>
                    <input value={settingsForm.name} onChange={(event) => setSettingsForm({ ...settingsForm, name: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-gray-700">Email</span>
                    <input type="email" value={settingsForm.email} onChange={(event) => setSettingsForm({ ...settingsForm, email: event.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-gray-700">Mục tiêu calo/ngày</span>
                    <input type="number" min={1200} max={5000} value={settingsForm.calorieTarget} onChange={(event) => setSettingsForm({ ...settingsForm, calorieTarget: Number(event.target.value) })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-gray-700">Mục tiêu nước/ngày</span>
                    <input type="number" min={1} max={20} value={settingsForm.waterTargetGlasses} onChange={(event) => setSettingsForm({ ...settingsForm, waterTargetGlasses: Number(event.target.value) })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" />
                  </label>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                    {statusMessage ? <p className="text-sm font-semibold text-green-700">{statusMessage}</p> : <span />}
                    <button disabled={savingSettings} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-white transition hover:bg-green-700 disabled:opacity-60">
                      <Save className="h-4 w-4" />
                      {savingSettings ? "Đang lưu..." : "Lưu cài đặt"}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileBenefits({ plan, benefits, tier, config }: { plan: Plan | null; benefits: Plan["features"]; tier: Tier; config: typeof tierConfig[Tier] }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Quyền lợi của bạn</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.badgeBg}`}>{plan?.name ?? config.label}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {benefits.map((benefit, index) => {
          const icons = [Zap, BookOpen, MessageCircle, Crown, Sparkles, Shield];
          const Icon = icons[index % icons.length];
          return (
            <div key={benefit.label} className={`rounded-2xl border p-4 transition-all ${benefit.included ? `${config.accentBg} ${config.accentBorder}` : "border-gray-200 bg-gray-50 opacity-60"}`}>
              <div className="mb-3 flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${benefit.included ? "bg-white shadow-sm" : "bg-gray-200"}`}>
                  <Icon className={`h-4 w-4 ${benefit.included ? config.accent : "text-gray-400"}`} />
                </div>
                {benefit.included ? <Check className={`h-4 w-4 ${config.accent}`} /> : <Lock className="h-4 w-4 text-gray-400" />}
              </div>
              <p className={benefit.included ? "text-gray-900" : "text-gray-400"} style={{ fontSize: "0.875rem", fontWeight: 600 }}>{benefit.label}</p>
            </div>
          );
        })}
      </div>
      {tier !== "svip" && (
        <div className={`mt-4 flex items-center justify-between rounded-2xl border p-4 ${config.accentBorder} ${config.accentBg}`}>
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-gray-900" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Nâng lên SVIP để mở khóa AI Coach và thêm quyền lợi</p>
              <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>Quyền gói được lấy từ backend sau checkout.</p>
            </div>
          </div>
          <Link to="/svip" className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-4 py-2 text-white transition-all hover:bg-amber-600" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            Nâng cấp <ArrowUpCircle className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

function PaymentHistory({ payments, showAll, onToggle, onDownload }: { payments: Payment[]; showAll: boolean; onToggle(): void; onDownload(payment: Payment): void }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Lịch sử thanh toán</h3>
        <button onClick={onToggle} className="text-green-600 hover:underline" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          {showAll ? "Thu gọn" : "Xem tất cả"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Ngày", "Gói", "Số tiền", "Trạng thái", "Hóa đơn"].map((header) => (
                <th key={header} className="py-3 text-left text-gray-500" style={{ fontSize: "0.78rem", fontWeight: 600 }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length ? payments.map((payment) => (
              <tr key={payment.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                <td className="py-3.5 text-gray-600" style={{ fontSize: "0.875rem" }}>{formatDate(payment.paidAt)}</td>
                <td className="py-3.5">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${payment.planId === "svip" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>{payment.planId.toUpperCase()}</span>
                </td>
                <td className="py-3.5 text-gray-900" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{formatMoney(payment.amount, payment.currency)}</td>
                <td className="py-3.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-green-700" style={{ fontSize: "0.8rem" }}>{payment.status}</span>
                  </div>
                </td>
                <td className="py-3.5">
                  <button onClick={() => onDownload(payment)} className="flex items-center gap-1 text-gray-500 transition-colors hover:text-gray-700">
                    <Download className="h-3.5 w-3.5" />
                    <span style={{ fontSize: "0.8rem" }}>{payment.invoice}</span>
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-500">Chưa có giao dịch nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
