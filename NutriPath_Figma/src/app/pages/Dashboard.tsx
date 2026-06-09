import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Plus, MessageCircle, Search, Droplets, Flame, TrendingUp, Target, Apple,
  ChevronRight, Zap, Award, Activity, Check, FileBarChart, Crown, Sparkles,
  Bike, Dumbbell, Gauge, Timer, Trash2, WandSparkles
} from "lucide-react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from "recharts";
import {
  addWorkout,
  addWaterIntake,
  createWeeklyCoachPlan,
  deleteWorkout,
  getDashboard,
  getWeeklyCoachPlans,
  type DashboardData,
  type WorkoutEntry,
  type WorkoutInput,
  type WeeklyCoachPlan,
} from "../api";

const quickActions = [
  { label: "Thêm bữa ăn", icon: Plus, color: "bg-green-600 text-white hover:bg-green-700", link: "/tracker" },
  { label: "Chat với AI", icon: MessageCircle, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200", link: "/" },
  { label: "Tìm công thức", icon: Search, color: "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200", link: "/recipes" },
  { label: "Báo cáo", icon: FileBarChart, color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200", link: "/reports" },
];

type WorkoutFormState = Required<Pick<WorkoutInput, "type" | "durationMinutes">> & {
  intensity: NonNullable<WorkoutInput["intensity"]>;
  distanceKm: number;
  speedKmh: number;
  inclinePct: number;
  notes: string;
};

const workoutTypes = [
  { id: "cycling", label: "Đạp xe", icon: Bike, hint: "Ngoài trời hoặc xe đạp tại chỗ" },
  { id: "running", label: "Chạy bộ", icon: Activity, hint: "Có thể nhập quãng đường hoặc tốc độ" },
  { id: "treadmill", label: "Chạy máy", icon: Gauge, hint: "Có thêm tốc độ và góc dốc" },
  { id: "gym", label: "Tập gym", icon: Dumbbell, hint: "Tạ, máy, circuit hoặc full-body" },
  { id: "hiit", label: "HIIT", icon: Zap, hint: "Cường độ cao, nghỉ ngắn" },
  { id: "swimming", label: "Bơi", icon: Droplets, hint: "Bơi nhẹ đến bơi nhanh" },
  { id: "walking", label: "Đi bộ nhanh", icon: Activity, hint: "Đi bộ ngoài trời hoặc máy" },
  { id: "yoga", label: "Yoga", icon: Sparkles, hint: "Nhẹ, giãn cơ, phục hồi" },
  { id: "custom", label: "Bài khác", icon: WandSparkles, hint: "AI hỗ trợ nếu mô tả đủ rõ" },
] as const;

const intensityOptions = [
  { id: "light", label: "Nhẹ" },
  { id: "moderate", label: "Vừa" },
  { id: "hard", label: "Nặng" },
  { id: "very_hard", label: "Rất nặng" },
] as const;

const confidenceLabel: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

function makeMojibake(value: string) {
  return Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join("");
}

const dashboardTextFixes = [
  ["Xin ch" + String.fromCharCode(0xc3) + " o", "Xin chào"],
  [makeMojibake("Xin chào"), "Xin chào"],
  [makeMojibake("Dữ liệu được tải từ backend"), "Dữ liệu được tải từ backend"],
  [makeMojibake("Bắt đầu chuỗi ghi bữa"), "Bắt đầu chuỗi ghi bữa"],
  [makeMojibake("Thêm bữa ăn hôm nay để tạo chuỗi mới"), "Thêm bữa ăn hôm nay để tạo chuỗi mới"],
  [makeMojibake("ly nước"), "ly nước"],
  [makeMojibake("Tiến độ nước hôm nay"), "Tiến độ nước hôm nay"],
  [makeMojibake("kcal còn lại"), "kcal còn lại"],
  [makeMojibake("Chưa có calo từ bữa ăn hôm nay"), "Chưa có calo từ bữa ăn hôm nay"],
] as const;

function cleanDashboardText(value: string) {
  return dashboardTextFixes.reduce((text, [broken, fixed]) => text.replaceAll(broken, fixed), value);
}

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waterMl, setWaterMl] = useState(0);
  const [waterInputMl, setWaterInputMl] = useState(250);
  const [coachPlan, setCoachPlan] = useState<WeeklyCoachPlan | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [workoutForm, setWorkoutForm] = useState<WorkoutFormState>({
    type: "cycling",
    durationMinutes: 30,
    intensity: "moderate",
    distanceKm: 0,
    speedKmh: 0,
    inclinePct: 0,
    notes: "",
  });
  const [workoutSaving, setWorkoutSaving] = useState(false);
  const [workoutMessage, setWorkoutMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadDashboard = () => {
      setError(null);
      return getDashboard()
      .then((data) => {
        if (!active) return;
        setDashboard(data);
        setWaterMl(data.mealLog.waterMl ?? Math.round(data.mealLog.waterGlasses * 250));
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
    getWeeklyCoachPlans()
      .then((data) => setCoachPlan(data._embedded.coachPlans[0] ?? null))
      .catch(() => null);
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
  const waterTargetMl = dashboard.nutrition.targets.waterMl ?? Math.round(dashboard.nutrition.targets.waterGlasses * 250);
  const waterProgressPct = waterTargetMl > 0 ? Math.min(100, Math.round((waterMl / waterTargetMl) * 100)) : 0;
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
  const workouts = (activity.workouts ?? dashboard.mealLog.workouts ?? []) as WorkoutEntry[];
  const workoutCalories = activity.workoutCalories ?? workouts.reduce((sum, workout) => sum + (Number(workout.calories) || 0), 0);
  const selectedWorkoutType = workoutTypes.find((type) => type.id === workoutForm.type) ?? workoutTypes[0];
  const SelectedWorkoutIcon = selectedWorkoutType.icon;
  const showMovementInputs = ["cycling", "running", "treadmill", "walking"].includes(workoutForm.type);
  const showInclineInput = workoutForm.type === "treadmill";
  const goals = dashboard.mealLog.goals;
  const greeting = cleanDashboardText(dashboard.greeting);
  const canUseCoach = Boolean(membershipAccess.aiCoach);

  const handleCreateCoachPlan = async () => {
    setCoachLoading(true);
    setCoachMessage(null);
    try {
      const data = await createWeeklyCoachPlan();
      setCoachPlan(data.plan);
      setCoachMessage("AI Coach đã tạo kế hoạch tuần mới.");
    } catch (err) {
      setCoachMessage(err instanceof Error ? err.message : "Không tạo được kế hoạch tuần.");
    } finally {
      setCoachLoading(false);
    }
  };

  const handleAddWater = async (amountMl = waterInputMl) => {
    const safeAmount = Math.round(Number(amountMl) || 0);
    if (!safeAmount || safeAmount < 1) return;
    const previous = waterMl;
    setWaterMl((current) => current + safeAmount);
    try {
      const updated = await addWaterIntake(dashboard.date, safeAmount);
      setWaterMl(updated.waterMl ?? Math.round(updated.waterGlasses * 250));
      setDashboard((current) => current ? { ...current, mealLog: updated, nutrition: updated.summary } : current);
    } catch {
      setWaterMl(previous);
    }
  };

  const updateWorkoutForm = <K extends keyof WorkoutFormState>(field: K, value: WorkoutFormState[K]) => {
    setWorkoutForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddWorkout = async () => {
    const durationMinutes = Math.round(Number(workoutForm.durationMinutes) || 0);
    if (durationMinutes < 1) {
      setWorkoutMessage("Vui lòng nhập thời lượng tập luyện hợp lệ.");
      return;
    }

    const payload: WorkoutInput = {
      type: workoutForm.type,
      durationMinutes,
      intensity: workoutForm.intensity,
      notes: workoutForm.notes.trim(),
      useAi: workoutForm.type === "custom" || workoutForm.notes.trim().length >= 20,
    };
    if (workoutForm.distanceKm > 0) payload.distanceKm = Number(workoutForm.distanceKm);
    if (workoutForm.speedKmh > 0) payload.speedKmh = Number(workoutForm.speedKmh);
    if (workoutForm.type === "treadmill") payload.inclinePct = Math.max(0, Number(workoutForm.inclinePct) || 0);

    setWorkoutSaving(true);
    setWorkoutMessage(null);
    try {
      const data = await addWorkout(dashboard.date, payload);
      setDashboard((current) => current ? { ...current, mealLog: data.mealLog, nutrition: data.mealLog.summary } : current);
      setWorkoutMessage(`${data.workout.label}: ước tính ${data.workout.calories.toLocaleString("vi-VN")} kcal đã đốt.`);
      setWorkoutForm((current) => ({
        ...current,
        durationMinutes: 30,
        distanceKm: 0,
        speedKmh: 0,
        inclinePct: current.type === "treadmill" ? current.inclinePct : 0,
        notes: "",
      }));
    } catch (err) {
      setWorkoutMessage(err instanceof Error ? err.message : "Không lưu được bài tập.");
    } finally {
      setWorkoutSaving(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    setWorkoutMessage(null);
    try {
      const updated = await deleteWorkout(dashboard.date, workoutId);
      setDashboard((current) => current ? { ...current, mealLog: updated, nutrition: updated.summary } : current);
      setWorkoutMessage("Đã xóa bài tập khỏi ngày hôm nay.");
    } catch (err) {
      setWorkoutMessage(err instanceof Error ? err.message : "Không xóa được bài tập.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-gray-900" style={{ fontSize: "1.6rem", fontWeight: 800 }}>{greeting} 👋</h1>
            <p className="text-gray-500 mt-1" style={{ fontSize: "0.9rem" }}>{dashboard.date} • Dữ liệu được tải từ backend</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:w-auto">
            {quickActions.map(({ label, icon: Icon, color, link }) => (
              <Link key={label} to={link} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all ${color}`} style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* 3-col grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* LEFT COLUMN */}
          <div className="space-y-6 xl:col-span-3">
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
              <div className="mb-4 h-3 overflow-hidden rounded-full bg-blue-50">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${waterProgressPct}%` }} />
              </div>
              <div className="text-center">
                <p className="text-gray-900" style={{ fontSize: "1.4rem", fontWeight: 800 }}>
                  {waterMl.toLocaleString("vi-VN")}ml <span className="text-gray-400" style={{ fontSize: "1rem", fontWeight: 400 }}>/ {waterTargetMl.toLocaleString("vi-VN")}ml</span>
                </p>
                <p className="text-blue-500 mt-1" style={{ fontSize: "0.8rem" }}>{waterProgressPct}% mục tiêu hôm nay</p>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[250, 330, 500, 700].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => void handleAddWater(amount)}
                    className="rounded-xl border border-blue-100 bg-blue-50 px-2 py-2 text-blue-700 transition hover:bg-blue-100"
                    style={{ fontSize: "0.78rem", fontWeight: 700 }}
                  >
                    +{amount}ml
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={3000}
                  value={waterInputMl}
                  onChange={(event) => setWaterInputMl(Number(event.target.value))}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-blue-400"
                  style={{ fontSize: "0.85rem" }}
                />
                <button
                  onClick={() => void handleAddWater()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                  style={{ fontSize: "0.85rem", fontWeight: 700 }}
                >
                  Ghi
                </button>
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
          <div className="space-y-6 xl:col-span-6">
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
                <div>
                  <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Hoạt động thể chất</h3>
                  <p className="mt-1 text-gray-500" style={{ fontSize: "0.78rem" }}>Nhập bài tập để hệ thống ước tính calo đã dùng.</p>
                </div>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
                      <SelectedWorkoutIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-gray-900" style={{ fontSize: "0.92rem", fontWeight: 800 }}>Ghi bài tập chi tiết</p>
                      <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>{selectedWorkoutType.hint}</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-green-700" style={{ fontSize: "0.74rem", fontWeight: 800 }}>
                    {Math.round(workoutCalories).toLocaleString("vi-VN")} kcal từ workout
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                  {workoutTypes.map(({ id, label, icon: Icon }) => {
                    const active = workoutForm.type === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateWorkoutForm("type", id)}
                        className={`flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition ${
                          active
                            ? "border-green-500 bg-white text-green-700 shadow-sm"
                            : "border-transparent bg-white/70 text-gray-600 hover:border-green-200 hover:bg-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span style={{ fontSize: "0.72rem", fontWeight: 800 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label className="block">
                    <span className="mb-1 block text-gray-600" style={{ fontSize: "0.74rem", fontWeight: 700 }}>Thời lượng</span>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                      <Timer className="h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min={1}
                        max={600}
                        value={workoutForm.durationMinutes}
                        onChange={(event) => updateWorkoutForm("durationMinutes", Number(event.target.value))}
                        className="min-w-0 flex-1 bg-transparent outline-none"
                        style={{ fontSize: "0.85rem", fontWeight: 700 }}
                      />
                      <span className="text-gray-400" style={{ fontSize: "0.75rem" }}>phút</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-gray-600" style={{ fontSize: "0.74rem", fontWeight: 700 }}>Cường độ</span>
                    <select
                      value={workoutForm.intensity}
                      onChange={(event) => updateWorkoutForm("intensity", event.target.value as WorkoutFormState["intensity"])}
                      className="h-[42px] w-full rounded-xl border border-gray-200 bg-white px-3 outline-none focus:border-green-400"
                      style={{ fontSize: "0.85rem", fontWeight: 700 }}
                    >
                      {intensityOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  {showMovementInputs && (
                    <label className="block">
                      <span className="mb-1 block text-gray-600" style={{ fontSize: "0.74rem", fontWeight: 700 }}>Quãng đường</span>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={workoutForm.distanceKm}
                        onChange={(event) => updateWorkoutForm("distanceKm", Number(event.target.value))}
                        className="h-[42px] w-full rounded-xl border border-gray-200 bg-white px-3 outline-none focus:border-green-400"
                        style={{ fontSize: "0.85rem", fontWeight: 700 }}
                        placeholder="km"
                      />
                    </label>
                  )}

                  {showMovementInputs && (
                    <label className="block">
                      <span className="mb-1 block text-gray-600" style={{ fontSize: "0.74rem", fontWeight: 700 }}>Tốc độ</span>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={workoutForm.speedKmh}
                        onChange={(event) => updateWorkoutForm("speedKmh", Number(event.target.value))}
                        className="h-[42px] w-full rounded-xl border border-gray-200 bg-white px-3 outline-none focus:border-green-400"
                        style={{ fontSize: "0.85rem", fontWeight: 700 }}
                        placeholder="km/h"
                      />
                    </label>
                  )}

                  {showInclineInput && (
                    <label className="block">
                      <span className="mb-1 block text-gray-600" style={{ fontSize: "0.74rem", fontWeight: 700 }}>Góc dốc máy</span>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        step={0.5}
                        value={workoutForm.inclinePct}
                        onChange={(event) => updateWorkoutForm("inclinePct", Number(event.target.value))}
                        className="h-[42px] w-full rounded-xl border border-gray-200 bg-white px-3 outline-none focus:border-green-400"
                        style={{ fontSize: "0.85rem", fontWeight: 700 }}
                        placeholder="%"
                      />
                    </label>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
                  <textarea
                    value={workoutForm.notes}
                    onChange={(event) => updateWorkoutForm("notes", event.target.value)}
                    className="min-h-[78px] rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-green-400"
                    style={{ fontSize: "0.85rem", lineHeight: 1.5 }}
                    placeholder="Ví dụ: tập gym lưng xô 45 phút, nghỉ 60 giây mỗi set; hoặc chạy máy 30 phút tốc độ 8km/h dốc 5%..."
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddWorkout()}
                    disabled={workoutSaving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 lg:min-w-[150px]"
                    style={{ fontSize: "0.86rem", fontWeight: 800 }}
                  >
                    <Plus className="h-4 w-4" />
                    {workoutSaving ? "Đang tính..." : "Tính & lưu"}
                  </button>
                </div>

                <p className="mt-2 text-gray-500" style={{ fontSize: "0.74rem", lineHeight: 1.5 }}>
                  Công thức mặc định dùng MET theo cân nặng, thời lượng và cường độ. Nếu là bài khác hoặc mô tả phức tạp, hệ thống sẽ dùng AI để ước tính bảo thủ hơn.
                </p>
                {workoutMessage && (
                  <p className="mt-3 rounded-xl bg-white px-3 py-2 text-green-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                    {workoutMessage}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-gray-900" style={{ fontSize: "0.92rem", fontWeight: 800 }}>Bài tập đã ghi hôm nay</p>
                  <span className="text-gray-500" style={{ fontSize: "0.76rem" }}>{workouts.length} mục</span>
                </div>
                {workouts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                    <Dumbbell className="mx-auto mb-2 h-6 w-6 text-green-500" />
                    <p className="text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Chưa có bài tập nào hôm nay</p>
                    <p className="mx-auto mt-1 max-w-md text-gray-500" style={{ fontSize: "0.76rem", lineHeight: 1.5 }}>
                      Ghi đạp xe, chạy bộ, chạy máy có dốc, tập gym hoặc bài khác để dashboard tính calo đã đốt.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workouts.map((workout) => (
                      <div key={workout.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 800 }}>{workout.label}</p>
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700" style={{ fontSize: "0.68rem", fontWeight: 800 }}>
                                {confidenceLabel[String(workout.confidence || "medium")] || "Trung bình"}
                              </span>
                              {workout.source?.startsWith("ai:") && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700" style={{ fontSize: "0.68rem", fontWeight: 800 }}>
                                  AI fallback
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-gray-500" style={{ fontSize: "0.76rem" }}>
                              {workout.durationMinutes} phút
                              {workout.speedKmh ? ` • ${workout.speedKmh} km/h` : ""}
                              {workout.distanceKm ? ` • ${workout.distanceKm} km` : ""}
                              {workout.inclinePct ? ` • dốc ${workout.inclinePct}%` : ""}
                              {workout.met ? ` • MET ${workout.met}` : ""}
                            </p>
                            {workout.note && (
                              <p className="mt-2 text-gray-600" style={{ fontSize: "0.76rem", lineHeight: 1.5 }}>{workout.note}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                            <p className="text-orange-600" style={{ fontSize: "1.05rem", fontWeight: 900 }}>{workout.calories.toLocaleString("vi-VN")} kcal</p>
                            <button
                              type="button"
                              onClick={() => void handleDeleteWorkout(workout.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50"
                              aria-label={`Xóa ${workout.label}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 xl:col-span-3">
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

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                    <Crown className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">SVIP AI Coach</span>
                  </div>
                  <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 800 }}>Kế hoạch tuần</h3>
                </div>
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>

              {canUseCoach ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleCreateCoachPlan()}
                    disabled={coachLoading}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {coachLoading ? "Đang tạo..." : coachPlan ? "Tạo lại kế hoạch" : "Tạo kế hoạch 7 ngày"}
                  </button>
                  {coachMessage && <p className="mb-3 text-sm font-semibold text-amber-800">{coachMessage}</p>}
                  {coachPlan ? (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-white/80 p-3">
                        <p className="text-sm font-bold text-gray-900">{coachPlan.title}</p>
                        <p className="mt-1 text-xs leading-5 text-gray-600">{coachPlan.summary}</p>
                      </div>
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {coachPlan.days.slice(0, 7).map((day) => (
                          <div key={day.date} className="rounded-xl bg-white px-3 py-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-bold text-gray-900">{day.label}</p>
                              <span className="text-xs font-semibold text-amber-700">{day.targetCalories} kcal</span>
                            </div>
                            <p className="mb-2 text-xs text-gray-500">{day.focus}</p>
                            <div className="space-y-1">
                              {day.meals.slice(0, 2).map((meal) => (
                                <p key={`${day.date}-${meal.name}`} className="text-xs leading-5 text-gray-700">
                                  <span className="font-bold">{meal.name}:</span> {meal.suggestion}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-amber-900">
                      Tạo kế hoạch 7 ngày dựa trên mục tiêu calo, macro và nhật ký bữa ăn gần nhất.
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-white/80 p-4">
                  <p className="text-sm font-bold text-gray-900">AI Coach chỉ dành cho SVIP</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">Nâng cấp để tạo kế hoạch ăn uống 7 ngày cá nhân hóa.</p>
                  <Link to="/svip" className="mt-3 inline-flex rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600">
                    Mở SVIP
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
