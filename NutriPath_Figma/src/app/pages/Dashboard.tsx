import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Plus, MessageCircle, Search, Droplets, Flame, TrendingUp, Target, Apple,
  ChevronRight, Zap, Award, Activity, Check
} from "lucide-react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from "recharts";
import { getDashboard, updateWater, type DashboardData } from "../api";

const quickActions = [
  { label: "Thêm bữa ăn", icon: Plus, color: "bg-green-600 text-white hover:bg-green-700", link: "/tracker" },
  { label: "Chat với AI", icon: MessageCircle, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200", link: "/" },
  { label: "Tìm công thức", icon: Search, color: "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200", link: "/recipes" },
];

function cleanDashboardText(value: string) {
  return value
    .replaceAll("Xin chÃ o", "Xin chào")
    .replaceAll("Xin chÃ o", "Xin chào")
    .replaceAll("Dá»¯ liá»‡u Ä‘Æ°á»£c táº£i tá»« backend", "Dữ liệu được tải từ backend")
    .replaceAll("Báº¯t Ä‘áº§u chuá»—i ghi bá»¯a", "Bắt đầu chuỗi ghi bữa")
    .replaceAll("ThÃªm bá»¯a Äƒn hÃ´m nay Ä‘á»ƒ táº¡o chuá»—i má»›i", "Thêm bữa ăn hôm nay để tạo chuỗi mới")
    .replaceAll("ly nÆ°á»›c", "ly nước")
    .replaceAll("Tiáº¿n Ä‘á»™ nÆ°á»›c hÃ´m nay", "Tiến độ nước hôm nay")
    .replaceAll("kcal cÃ²n láº¡i", "kcal còn lại")
    .replaceAll("ChÆ°a cÃ³ calo tá»« bá»¯a Äƒn hÃ´m nay", "Chưa có calo từ bữa ăn hôm nay");
}

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waterGlasses, setWaterGlasses] = useState(5);

  useEffect(() => {
    let active = true;
    const loadDashboard = () => {
      setError(null);
      return getDashboard()
      .then((data) => {
        if (!active) return;
        setDashboard(data);
        setWaterGlasses(data.mealLog.waterGlasses);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không tải được dữ liệu dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    };

    loadDashboard();
    window.addEventListener("nutripath:member-updated", loadDashboard);

    return () => {
      active = false;
      window.removeEventListener("nutripath:member-updated", loadDashboard);
    };
  }, []);

  if (loading) {
    return <div className="bg-gray-50 min-h-screen p-8 text-gray-500">Đang tải dữ liệu dashboard...</div>;
  }

  if (error || !dashboard) {
    return <div className="bg-gray-50 min-h-screen p-8 text-red-600">{error ?? "Không có dữ liệu dashboard"}</div>;
  }

  const iconByMeal: Record<string, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍊",
  };
  const mealTheme: Record<string, { color: string; border: string; iconBg: string }> = {
    breakfast: { color: "bg-yellow-50", border: "border-yellow-200", iconBg: "bg-yellow-100" },
    lunch: { color: "bg-green-50", border: "border-green-200", iconBg: "bg-green-100" },
    dinner: { color: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100" },
    snack: { color: "bg-purple-50", border: "border-purple-200", iconBg: "bg-purple-100" },
  };
  const totalConsumed = dashboard.nutrition.totals.calories;
  const calorieTarget = dashboard.nutrition.targets.calories;
  const pct = calorieTarget > 0 ? Math.round((totalConsumed / calorieTarget) * 100) : 0;
  const remainingCalories = dashboard.nutrition.remainingCalories;
  const waterTarget = dashboard.nutrition.targets.waterGlasses;
  const weeklyData = dashboard.weeklyProgress;
  const membershipAccess = dashboard.member.access;
  const meals = dashboard.mealLog.meals
    .filter((meal) => meal.items.length > 0)
    .map((meal) => ({
      type: meal.name,
      time: meal.time,
      icon: iconByMeal[meal.id] ?? "🍽️",
      kcal: meal.totalCalories,
      items: meal.items.map((item) => `${item.name} ${item.portion} (${item.calories} kcal)`),
      ...(mealTheme[meal.id] ?? { color: "bg-gray-50", border: "border-gray-200", iconBg: "bg-gray-100" }),
    }));
  const macros = [
    { name: "Protein", current: dashboard.nutrition.totals.protein, target: dashboard.nutrition.targets.protein, color: "#16a34a", unit: "g" },
    { name: "Carbs", current: dashboard.nutrition.totals.carbs, target: dashboard.nutrition.targets.carbs, color: "#3b82f6", unit: "g" },
    { name: "Chất béo", current: dashboard.nutrition.totals.fat, target: dashboard.nutrition.targets.fat, color: "#f59e0b", unit: "g" },
  ];
  const tips = dashboard.tips;
  const activity = dashboard.mealLog.activity;
  const goals = dashboard.mealLog.goals;
  const greeting = cleanDashboardText(dashboard.greeting);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-gray-900" style={{ fontSize: "1.6rem", fontWeight: 800 }}>{greeting} 👋</h1>
            <p className="text-gray-500 mt-1" style={{ fontSize: "0.9rem" }}>{dashboard.date} • Dữ liệu được tải từ backend</p>
          </div>
          <div className="flex items-center gap-3">
            {quickActions.map(({ label, icon: Icon, color, link }) => (
              <Link key={label} to={link} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${color}`} style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* 3-col grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT COLUMN */}
          <div className="col-span-3 space-y-6">
            {/* Calorie Ring */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Calo hôm nay</h3>
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="65%"
                    outerRadius="90%"
                    startAngle={90}
                    endAngle={-270}
                    data={[{ name: "progress", value: pct, fill: "#16a34a" }]}
                  >
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#dcfce7" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-gray-900" style={{ fontSize: "1.8rem", fontWeight: 800 }}>{totalConsumed}</span>
                  <span className="text-gray-400" style={{ fontSize: "0.78rem" }}>/ {calorieTarget} kcal</span>
                  <span className="text-green-600 mt-1" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{pct}% mục tiêu</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-green-700" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{remainingCalories}</p>
                  <p className="text-gray-500" style={{ fontSize: "0.72rem" }}>kcal còn lại</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-orange-600" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{activity.burnedCalories}</p>
                  <p className="text-gray-500" style={{ fontSize: "0.72rem" }}>kcal đã đốt</p>
                </div>
              </div>
            </div>

            {/* Macros */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-900 mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>Dinh dưỡng đa lượng</h3>
              <div className="space-y-4">
                {macros.map((m) => (
                  <div key={m.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-gray-600" style={{ fontSize: "0.85rem" }}>{m.name}</span>
                      <span className="text-gray-900" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.current}/{m.target}{m.unit}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%`, backgroundColor: m.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Water Tracker */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Lượng nước</h3>
                <Droplets className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                {Array.from({ length: waterTarget }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const next = i < waterGlasses ? i : i + 1;
                      setWaterGlasses(next);
                      updateWater(dashboard.date, next).catch(() => setWaterGlasses(dashboard.mealLog.waterGlasses));
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      i < waterGlasses ? "bg-blue-500 text-white shadow-sm" : "bg-gray-100 text-gray-400 hover:bg-blue-100"
                    }`}
                    title={`${i + 1} ly`}
                  >
                    <Droplets className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <div className="text-center">
                <p className="text-gray-900" style={{ fontSize: "1.4rem", fontWeight: 800 }}>
                  {waterGlasses} <span className="text-gray-400" style={{ fontSize: "1rem", fontWeight: 400 }}>/ {waterTarget} ly</span>
                </p>
                <p className="text-blue-500 mt-1" style={{ fontSize: "0.8rem" }}>{waterGlasses * 250}ml / {waterTarget * 250}ml</p>
              </div>
            </div>

            {/* Daily Tip */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-green-700" style={{ fontSize: "0.85rem", fontWeight: 700 }}>Mẹo hôm nay</span>
              </div>
              <p className="text-gray-700" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>{cleanDashboardText(tips[0] ?? "")}</p>
            </div>
          </div>

          {/* CENTER COLUMN */}
          <div className="col-span-6 space-y-6">
            {/* Today's Meals */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Nhật ký bữa ăn hôm nay</h3>
                <Link to="/tracker" className="flex items-center gap-1 text-green-600 hover:text-green-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {meals.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <Apple className="mx-auto mb-3 h-8 w-8 text-green-500" />
                    <p className="text-gray-900" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Hôm nay chưa có bữa ăn nào</p>
                    <p className="mx-auto mt-2 max-w-sm text-gray-500" style={{ fontSize: "0.86rem", lineHeight: 1.6 }}>
                      Thêm món ở Meal Tracker để dashboard cập nhật calo, macro và tiến trình tuần theo dữ liệu thật.
                    </p>
                    <Link to="/tracker" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-white hover:bg-green-700" style={{ fontSize: "0.86rem", fontWeight: 700 }}>
                      <Plus className="h-4 w-4" />
                      Thêm bữa ăn
                    </Link>
                  </div>
                )}
                {meals.map((meal) => (
                  <div key={meal.type} className={`${meal.color} border ${meal.border} rounded-2xl p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${meal.iconBg} rounded-xl flex items-center justify-center`}>
                          <span style={{ fontSize: "1.1rem" }}>{meal.icon}</span>
                        </div>
                        <div>
                          <p className="text-gray-900" style={{ fontSize: "0.95rem", fontWeight: 700 }}>{meal.type}</p>
                          <p className="text-gray-400" style={{ fontSize: "0.78rem" }}>{meal.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>{meal.kcal} <span className="text-gray-400" style={{ fontSize: "0.8rem", fontWeight: 400 }}>kcal</span></p>
                        <Link to="/tracker" className="text-green-600 hover:text-green-700" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                          + Thêm
                        </Link>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {meal.items.map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600" style={{ fontSize: "0.82rem" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity & Burn */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Hoạt động thể chất</h3>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Đi bộ", value: activity.steps.toLocaleString("vi-VN"), unit: "bước", icon: "🚶", color: "bg-green-50 text-green-700" },
                  { label: "Đốt cháy", value: activity.burnedCalories.toLocaleString("vi-VN"), unit: "kcal", icon: "🔥", color: "bg-orange-50 text-orange-700" },
                  { label: "Thời gian", value: activity.activeMinutes.toLocaleString("vi-VN"), unit: "phút", icon: "⏱️", color: "bg-blue-50 text-blue-700" },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.color.split(" ")[0]} rounded-2xl p-4 text-center`}>
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <p className={`${stat.color.split(" ")[1]}`} style={{ fontSize: "1.3rem", fontWeight: 800 }}>{stat.value}</p>
                    <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>{stat.unit}</p>
                    <p className="text-gray-600 mt-0.5" style={{ fontSize: "0.8rem" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-3 space-y-6">
            {/* Weekly Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Tiến trình tuần</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ fontSize: "0.75rem", borderRadius: "8px", border: "1px solid #f3f4f6" }}
                    formatter={(val: number) => [`${val} kcal`]}
                  />
                  <Bar dataKey="target" fill="#dcfce7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consumed" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell key={index} fill={entry.consumed > entry.target ? "#f87171" : entry.consumed > 0 ? "#16a34a" : "#e5e7eb"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                  <span className="text-gray-500" style={{ fontSize: "0.72rem" }}>Thực tế</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-100 rounded-sm"></div>
                  <span className="text-gray-500" style={{ fontSize: "0.72rem" }}>Mục tiêu</span>
                </div>
              </div>
              {membershipAccess && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                  <p className="text-amber-900" style={{ fontSize: "0.78rem", fontWeight: 800 }}>
                    Báo cáo theo gói {membershipAccess.tier.toUpperCase()}
                  </p>
                  <p className="mt-1 text-amber-800" style={{ fontSize: "0.74rem", lineHeight: 1.6 }}>
                    Mở lịch sử và phân tích trong {membershipAccess.analyticsWindowDays} ngày
                    {membershipAccess.reportExports ? ", có xuất báo cáo." : "."}
                  </p>
                </div>
              )}
            </div>

            {/* Streak & Achievement */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Thành tích</h3>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="space-y-3">
                {dashboard.achievements.map((achievement, index) => (
                  <div key={achievement.id} className={`flex items-center gap-3 p-3 rounded-xl ${index === 0 ? "bg-yellow-50" : index === 1 ? "bg-green-50" : "bg-blue-50"}`}>
                    <span className="text-2xl">{index === 0 ? "🔥" : index === 1 ? "💧" : "🎯"}</span>
                    <div>
                      <p className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{cleanDashboardText(achievement.label)}</p>
                      <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>{cleanDashboardText(achievement.description)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Goal Summary */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-green-200" />
                <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>Mục tiêu hôm nay</span>
              </div>
              <div className="space-y-2.5">
                {goals.map((goal) => (
                  <div key={goal.label} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${goal.done ? "bg-white" : "bg-white/20 border-2 border-white/30"}`}>
                      {goal.done && <Check className="w-3 h-3 text-green-600" />}
                    </div>
                    <span className={goal.done ? "text-white" : "text-green-200"} style={{ fontSize: "0.85rem" }}>{cleanDashboardText(goal.label)}</span>
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
