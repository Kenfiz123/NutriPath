import { useMemo, useState } from "react";
import { Calculator, Dumbbell, Flame, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  calculateCalories as requestCalorieCalculation,
  getStoredSession,
  saveNutritionProfile,
  setStoredSession,
  type CalorieCalculation,
  type CalorieCalculationInput,
} from "../api";

type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type Goal = "lose" | "maintain" | "gain";

const activityLevels: Array<{ value: ActivityLevel; label: string; desc: string; multiplier: number }> = [
  { value: "sedentary", label: "Ít vận động", desc: "Ngồi văn phòng, ít hoặc không tập", multiplier: 1.2 },
  { value: "light", label: "Nhẹ nhàng", desc: "Tập nhẹ 1-3 ngày/tuần", multiplier: 1.375 },
  { value: "moderate", label: "Vừa phải", desc: "Tập vừa 3-5 ngày/tuần", multiplier: 1.55 },
  { value: "active", label: "Năng động", desc: "Tập nặng 6-7 ngày/tuần", multiplier: 1.725 },
  { value: "very_active", label: "Rất năng động", desc: "Tập rất nặng hoặc chơi thể thao cường độ cao", multiplier: 1.9 },
];

const exerciseTypes: Array<{ value: string; label: string }> = [
  { value: "walking", label: "Đi bộ" },
  { value: "running", label: "Chạy bộ" },
  { value: "cycling", label: "Đạp xe" },
  { value: "swimming", label: "Bơi lội" },
  { value: "yoga", label: "Yoga" },
  { value: "hiit", label: "HIIT" },
  { value: "gym", label: "Gym" },
  { value: "badminton", label: "Cầu lông" },
];

const MACRO_COLORS = ["#16a34a", "#3b82f6", "#f59e0b"];

function buildInitialInput(): CalorieCalculationInput {
  const session = getStoredSession();
  const profile = session?.member?.nutritionProfile;
  if (profile) {
    return {
      age: profile.input.age,
      weightKg: profile.input.weightKg,
      heightCm: profile.input.heightCm,
      gender: profile.input.gender,
      activityLevel: profile.input.activityLevel,
      goal: profile.input.goal,
      exerciseType: profile.input.exerciseType,
      durationMinutes: profile.input.durationMinutes,
    };
  }

  return {
    age: session?.member?.age ?? 25,
    weightKg: session?.member?.weightKg ?? 65,
    heightCm: session?.member?.heightCm ?? 168,
    gender: session?.member?.gender ?? "female",
    activityLevel: (session?.member?.activityLevel as ActivityLevel | undefined) ?? "light",
    goal: session?.member?.goal ?? "lose",
    exerciseType: "walking",
    durationMinutes: 30,
  };
}

function getInitialCalculation(): CalorieCalculation | null {
  const profile = getStoredSession()?.member?.nutritionProfile;
  if (!profile) return null;
  return {
    input: profile.input,
    results: profile.results,
  };
}

function getMacro(calculation: CalorieCalculation | null, name: string) {
  return calculation?.results.macros.find((item) => item.name === name)
    || { name, grams: 0, calories: 0, pct: 0 };
}

function getFatMacro(calculation: CalorieCalculation | null) {
  return calculation?.results.macros.find((item) => item.name !== "Protein" && item.name !== "Carbs")
    || { name: "Chất béo", grams: 0, calories: 0, pct: 0 };
}

function formatSavedTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function CalorieCalculator() {
  const initialInput = useMemo(() => buildInitialInput(), []);
  const [age, setAge] = useState(initialInput.age);
  const [weightKg, setWeightKg] = useState(initialInput.weightKg);
  const [heightCm, setHeightCm] = useState(initialInput.heightCm);
  const [gender, setGender] = useState<Gender>(initialInput.gender);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialInput.activityLevel as ActivityLevel);
  const [goal, setGoal] = useState<Goal>(initialInput.goal);
  const [exerciseType, setExerciseType] = useState(initialInput.exerciseType ?? "walking");
  const [durationMinutes, setDurationMinutes] = useState(initialInput.durationMinutes ?? 30);
  const [calculation, setCalculation] = useState<CalorieCalculation | null>(() => getInitialCalculation());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const session = getStoredSession();
  const isLoggedIn = Boolean(session?.token);
  const tier = session?.member?.tier ?? "free";
  const lastSaved = session?.member?.nutritionProfile?.updatedAt;

  const macroData = calculation ? [
    getMacro(calculation, "Protein"),
    getMacro(calculation, "Carbs"),
    getFatMacro(calculation),
  ] : [];

  const exerciseLabel = exerciseTypes.find((item) => item.value === exerciseType)?.label ?? "Đi bộ";

  async function handleCalculate() {
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const payload: CalorieCalculationInput = {
      age: Number(age),
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      gender,
      activityLevel,
      goal,
      exerciseType,
      durationMinutes: Number(durationMinutes),
    };

    try {
      if (isLoggedIn) {
        const data = await saveNutritionProfile(payload);
        setCalculation(data.calculation);

        const nextSession = getStoredSession();
        if (nextSession) {
          setStoredSession({ ...nextSession, member: data.member });
        }
        window.dispatchEvent(new CustomEvent("nutripath:member-updated", { detail: { member: data.member } }));

        setNotice(
          tier === "vip" || tier === "svip"
            ? "Đã lưu hồ sơ dinh dưỡng mới nhất. NutriBot VIP/SVIP có thể dùng dữ liệu này để tư vấn sát hơn."
            : "Đã lưu hồ sơ dinh dưỡng mới nhất vào tài khoản của bạn.",
        );
      } else {
        const data = await requestCalorieCalculation(payload);
        setCalculation(data);
        setNotice("Bạn đang tính nhanh ở chế độ khách. Đăng nhập để lưu vào dashboard và hồ sơ cá nhân.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tính toán lúc này.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-gray-900" style={{ fontSize: "1.6rem", fontWeight: 800 }}>Máy Tính Calo & Dinh Dưỡng</h1>
            <p className="mt-2 text-gray-500" style={{ fontSize: "0.95rem" }}>
              Tính BMR, TDEE, macro và lưu snapshot mới nhất vào hồ sơ người dùng.
            </p>
            {lastSaved && (
              <p className="mt-2 text-green-700" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                Lần lưu gần nhất: {formatSavedTime(lastSaved)}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-green-700" style={{ fontSize: "0.84rem", fontWeight: 600 }}>
            {isLoggedIn
              ? tier === "vip" || tier === "svip"
                ? "Dashboard và NutriBot VIP/SVIP sẽ dùng dữ liệu mới nhất sau mỗi lần tính."
                : "Dashboard sẽ cập nhật theo dữ liệu mới nhất sau mỗi lần tính."
              : "Đăng nhập để lưu kết quả vào dashboard và cho AI dùng về sau."}
          </div>
        </div>

        {(notice || error) && (
          <div className={`mb-6 rounded-2xl border px-5 py-4 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
            <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>{error || notice}</p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                  <Calculator className="h-4 w-4 text-green-600" />
                </div>
                Thông tin cơ bản
              </h2>

              <div className="mb-5">
                <label className="mb-2 block text-gray-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Giới tính</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "male", label: "Nam" },
                    { value: "female", label: "Nữ" },
                  ] as const).map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setGender(item.value)}
                      className={`rounded-xl border-2 py-2.5 transition-all ${
                        gender === item.value
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                      style={{ fontSize: "0.9rem", fontWeight: 600 }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Tuổi", value: age, setValue: setAge, unit: "tuổi", min: 15, max: 90 },
                  { label: "Cân nặng", value: weightKg, setValue: setWeightKg, unit: "kg", min: 30, max: 250 },
                  { label: "Chiều cao", value: heightCm, setValue: setHeightCm, unit: "cm", min: 130, max: 230 },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="mb-2 block text-gray-700" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{field.label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={field.value}
                        onChange={(event) => field.setValue(Number(event.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                        style={{ fontSize: "0.95rem", fontWeight: 600 }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: "0.75rem" }}>{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-gray-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Mức độ hoạt động</label>
                <div className="space-y-2">
                  {activityLevels.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setActivityLevel(item.value)}
                      className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                        activityLevel === item.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <p className={activityLevel === item.value ? "text-green-700" : "text-gray-800"} style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.label}</p>
                        <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>{item.desc}</p>
                      </div>
                      <span className={activityLevel === item.value ? "text-green-600" : "text-gray-400"} style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                        x{item.multiplier}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 700 }}>Mục tiêu</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "lose", label: "Giảm cân", icon: TrendingDown, active: "border-blue-500 bg-blue-50 text-blue-600" },
                  { value: "maintain", label: "Duy trì", icon: Minus, active: "border-green-500 bg-green-50 text-green-600" },
                  { value: "gain", label: "Tăng cân", icon: TrendingUp, active: "border-orange-500 bg-orange-50 text-orange-600" },
                ] as const).map(({ value, label, icon: Icon, active }) => (
                  <button
                    key={value}
                    onClick={() => setGoal(value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 transition-all ${
                      goal === value ? active : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                <Dumbbell className="h-5 w-5 text-green-600" />
                Bài tập tham chiếu
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-gray-700" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Loại bài tập</label>
                  <select
                    value={exerciseType}
                    onChange={(event) => setExerciseType(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 transition-all focus:border-green-500 focus:outline-none"
                    style={{ fontSize: "0.875rem" }}
                  >
                    {exerciseTypes.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-gray-700" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Thời gian</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={durationMinutes}
                      onChange={(event) => setDurationMinutes(Number(event.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 transition-all focus:border-green-500 focus:outline-none"
                      style={{ fontSize: "0.875rem" }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: "0.75rem" }}>phút</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 py-4 text-white shadow-lg transition-all hover:from-green-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ fontSize: "1rem", fontWeight: 700 }}
            >
              <div className="flex items-center justify-center gap-2">
                <Calculator className="h-5 w-5" />
                {submitting ? "Đang tính và lưu..." : "Tính Toán Ngay"}
              </div>
            </button>
          </div>

          <div className="col-span-7 space-y-6">
            {!calculation ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-16 text-center shadow-sm">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                  <Calculator className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="mb-2 text-gray-700" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Sẵn sàng tính toán?</h3>
                <p className="max-w-xs text-gray-400" style={{ fontSize: "0.9rem" }}>
                  Điền thông tin bên trái để xem kết quả chi tiết và lưu hồ sơ mới nhất của bạn.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "BMR",
                      value: calculation.results.bmr,
                      desc: "Calo cơ bản",
                      color: "bg-orange-50 border-orange-100",
                      valueColor: "text-orange-600",
                    },
                    {
                      label: "TDEE",
                      value: calculation.results.tdee,
                      desc: "Tiêu thụ hàng ngày",
                      color: "bg-blue-50 border-blue-100",
                      valueColor: "text-blue-600",
                    },
                    {
                      label: "Calo mục tiêu",
                      value: calculation.results.calorieGoal,
                      desc: calculation.results.goalDelta === 0
                        ? "Duy trì cân nặng"
                        : `${calculation.results.goalDelta > 0 ? "+" : ""}${calculation.results.goalDelta} so với TDEE`,
                      color: "bg-green-50 border-green-100",
                      valueColor: "text-green-600",
                    },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border p-5 text-center ${item.color}`}>
                      <p className={item.valueColor} style={{ fontSize: "1.8rem", fontWeight: 800 }}>{item.value.toLocaleString()}</p>
                      <p className="mt-1 text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{item.label}</p>
                      <p className="mt-1 text-gray-500" style={{ fontSize: "0.75rem" }}>{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-5 text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Phân chia dinh dưỡng đa lượng</h3>
                  <div className="grid grid-cols-2 items-center gap-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={macroData}
                          dataKey="calories"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={92}
                          paddingAngle={3}
                        >
                          {macroData.map((_, index) => (
                            <Cell key={index} fill={MACRO_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} kcal`, "Năng lượng"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-4">
                      {macroData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: MACRO_COLORS[index] }}></div>
                          <div className="flex-1">
                            <div className="mb-1 flex justify-between">
                              <span className="text-gray-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.name}</span>
                              <span className="text-gray-900" style={{ fontSize: "0.875rem", fontWeight: 700 }}>{item.grams}g</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100">
                              <div className="h-2 rounded-full" style={{ width: `${Math.max(4, item.pct)}%`, backgroundColor: MACRO_COLORS[index] }}></div>
                            </div>
                            <p className="mt-0.5 text-gray-400" style={{ fontSize: "0.72rem" }}>{item.pct}% • {item.calories} kcal</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Chỉ số BMI</h3>
                  <div className="flex items-end gap-3">
                    <span className="text-green-600" style={{ fontSize: "2.5rem", fontWeight: 800 }}>{calculation.results.bmi.value}</span>
                    <span className="mb-1 text-green-600" style={{ fontSize: "1rem", fontWeight: 600 }}>{calculation.results.bmi.label}</span>
                  </div>
                  <p className="mt-3 text-gray-500" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
                    Đây là chỉ số tham khảo nhanh từ chiều cao và cân nặng hiện tại, giúp NutriPath gợi ý mục tiêu calo phù hợp hơn.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>
                    <Flame className="h-5 w-5 text-orange-500" />
                    Calo đốt khi tập
                  </h3>
                  <div className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
                      <Flame className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <p className="mb-1 text-gray-600" style={{ fontSize: "0.85rem" }}>{exerciseLabel} trong {durationMinutes} phút</p>
                      <p className="text-orange-600" style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                        {calculation.results.exercise.burnedCalories} <span className="text-gray-500" style={{ fontSize: "1rem", fontWeight: 500 }}>kcal</span>
                      </p>
                      <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>
                        Tương đương khoảng {calculation.results.exercise.fatEquivalentGrams}g chất béo đốt cháy.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
