import { useState } from "react";
import { Calculator, Flame, Target, Dumbbell, ChevronDown, Info, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type Goal = "lose" | "maintain" | "gain";

const activityLevels: { value: ActivityLevel; label: string; desc: string; multiplier: number }[] = [
  { value: "sedentary", label: "Ít vận động", desc: "Ngồi văn phòng, ít hoặc không tập", multiplier: 1.2 },
  { value: "light", label: "Nhẹ nhàng", desc: "Tập nhẹ 1–3 ngày/tuần", multiplier: 1.375 },
  { value: "moderate", label: "Vừa phải", desc: "Tập vừa 3–5 ngày/tuần", multiplier: 1.55 },
  { value: "active", label: "Năng động", desc: "Tập nặng 6–7 ngày/tuần", multiplier: 1.725 },
  { value: "very_active", label: "Rất năng động", desc: "Tập rất nặng hoặc VĐV", multiplier: 1.9 },
];

const exerciseTypes = [
  { label: "Đi bộ", calPerMin: 5 },
  { label: "Chạy bộ", calPerMin: 10 },
  { label: "Đạp xe", calPerMin: 8 },
  { label: "Bơi lội", calPerMin: 9 },
  { label: "Yoga", calPerMin: 4 },
  { label: "HIIT", calPerMin: 12 },
  { label: "Gym (cơ)", calPerMin: 7 },
  { label: "Cầu lông", calPerMin: 8 },
];

const MACRO_COLORS = ["#16a34a", "#3b82f6", "#f59e0b"];

export function CalorieCalculator() {
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(65);
  const [height, setHeight] = useState(168);
  const [gender, setGender] = useState<Gender>("female");
  const [activity, setActivity] = useState<ActivityLevel>("light");
  const [goal, setGoal] = useState<Goal>("lose");
  const [exerciseType, setExerciseType] = useState(0);
  const [duration, setDuration] = useState(30);
  const [calculated, setCalculated] = useState(false);

  // Calculations
  let bmr = 0;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const actLevel = activityLevels.find((a) => a.value === activity)!;
  const tdee = Math.round(bmr * actLevel.multiplier);

  let calorieGoal = tdee;
  let goalDelta = 0;
  if (goal === "lose") { calorieGoal = tdee - 500; goalDelta = -500; }
  if (goal === "gain") { calorieGoal = tdee + 300; goalDelta = 300; }

  const protein = Math.round(weight * 1.8);
  const fat = Math.round((calorieGoal * 0.25) / 9);
  const carbs = Math.round((calorieGoal - protein * 4 - fat * 9) / 4);

  const macroData = [
    { name: "Protein", value: protein * 4, grams: protein, pct: Math.round((protein * 4 / calorieGoal) * 100) },
    { name: "Carbs", value: carbs * 4, grams: carbs, pct: Math.round((carbs * 4 / calorieGoal) * 100) },
    { name: "Chất béo", value: fat * 9, grams: fat, pct: Math.round((fat * 9 / calorieGoal) * 100) },
  ];

  const burnedCalories = Math.round(exerciseTypes[exerciseType].calPerMin * duration * (weight / 70));

  const handleCalc = () => setCalculated(true);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2" style={{ fontSize: "1.6rem", fontWeight: 800 }}>Máy Tính Calo & Dinh Dưỡng</h1>
          <p className="text-gray-500" style={{ fontSize: "0.95rem" }}>Tính BMR, TDEE và nhu cầu dinh dưỡng cá nhân hoá</p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* LEFT: Form */}
          <div className="col-span-5 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-gray-900 mb-5 flex items-center gap-2" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-green-600" />
                </div>
                Thông tin cơ bản
              </h2>

              {/* Gender */}
              <div className="mb-5">
                <label className="text-gray-700 mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Giới tính</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-2.5 rounded-xl border-2 transition-all ${
                        gender === g
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                      style={{ fontSize: "0.9rem", fontWeight: 600 }}
                    >
                      {g === "male" ? "👨 Nam" : "👩 Nữ"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age, Weight, Height */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Tuổi", value: age, setter: setAge, unit: "tuổi", min: 15, max: 80 },
                  { label: "Cân nặng", value: weight, setter: setWeight, unit: "kg", min: 30, max: 200 },
                  { label: "Chiều cao", value: height, setter: setHeight, unit: "cm", min: 130, max: 230 },
                ].map(({ label, value, setter, unit, min, max }) => (
                  <div key={label}>
                    <label className="text-gray-700 mb-2 block" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={value}
                        min={min}
                        max={max}
                        onChange={(e) => setter(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                        style={{ fontSize: "0.95rem", fontWeight: 600 }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: "0.75rem" }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Level */}
              <div>
                <label className="text-gray-700 mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Mức độ hoạt động</label>
                <div className="space-y-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setActivity(level.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        activity === level.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <p className={`${activity === level.value ? "text-green-700" : "text-gray-800"}`} style={{ fontSize: "0.875rem", fontWeight: 600 }}>{level.label}</p>
                        <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>{level.desc}</p>
                      </div>
                      <span className={`${activity === level.value ? "text-green-600" : "text-gray-400"}`} style={{ fontSize: "0.8rem", fontWeight: 600 }}>×{level.multiplier}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Goal */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-gray-900 mb-4" style={{ fontSize: "1.05rem", fontWeight: 700 }}>Mục tiêu</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "lose", label: "Giảm cân", icon: TrendingDown, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-500" },
                  { value: "maintain", label: "Duy trì", icon: Minus, color: "text-green-600", bg: "bg-green-50", border: "border-green-500" },
                  { value: "gain", label: "Tăng cân", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-500" },
                ] as const).map(({ value, label, icon: Icon, color, bg, border }) => (
                  <button
                    key={value}
                    onClick={() => setGoal(value)}
                    className={`py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                      goal === value ? `${border} ${bg}` : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${goal === value ? color : "text-gray-400"}`} />
                    <span className={`${goal === value ? color : "text-gray-600"}`} style={{ fontSize: "0.85rem", fontWeight: 600 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalc}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg"
              style={{ fontSize: "1rem", fontWeight: 700 }}
            >
              <div className="flex items-center justify-center gap-2">
                <Calculator className="w-5 h-5" />
                Tính Toán Ngay
              </div>
            </button>
          </div>

          {/* RIGHT: Results */}
          <div className="col-span-7 space-y-6">
            {!calculated ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <Calculator className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-gray-700 mb-2" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Sẵn sàng tính toán?</h3>
                <p className="text-gray-400 max-w-xs" style={{ fontSize: "0.9rem" }}>Điền thông tin bên trái và nhấn "Tính Toán Ngay" để xem kết quả chi tiết.</p>
              </div>
            ) : (
              <>
                {/* Main Results */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "BMR", value: Math.round(bmr), desc: "Calo cơ bản", icon: "🔥", color: "bg-orange-50 border-orange-100", valueColor: "text-orange-600" },
                    { label: "TDEE", value: tdee, desc: "Tiêu thụ hàng ngày", icon: "⚡", color: "bg-blue-50 border-blue-100", valueColor: "text-blue-600" },
                    { label: "Calo Mục Tiêu", value: calorieGoal, desc: goalDelta !== 0 ? `${goalDelta > 0 ? "+" : ""}${goalDelta} so với TDEE` : "Duy trì cân nặng", icon: "🎯", color: "bg-green-50 border-green-100", valueColor: "text-green-600" },
                  ].map((item) => (
                    <div key={item.label} className={`${item.color} border rounded-2xl p-5 text-center`}>
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <p className={`${item.valueColor} mb-1`} style={{ fontSize: "1.8rem", fontWeight: 800 }}>{item.value.toLocaleString()}</p>
                      <p className="text-gray-900 mb-1" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{item.label}</p>
                      <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Macro Donut Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-gray-900 mb-5" style={{ fontSize: "1rem", fontWeight: 700 }}>Phân chia dinh dưỡng đa lượng</h3>
                  <div className="grid grid-cols-2 gap-6 items-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%" cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {macroData.map((_, i) => (
                            <Cell key={i} fill={MACRO_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => [`${val} kcal`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-4">
                      {macroData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: MACRO_COLORS[i] }}></div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.name}</span>
                              <span className="text-gray-900" style={{ fontSize: "0.875rem", fontWeight: 700 }}>{item.grams}g</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${item.pct}%`, backgroundColor: MACRO_COLORS[i] }}></div>
                            </div>
                            <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.72rem" }}>{item.pct}% • {item.value} kcal</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* BMI Info */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-gray-900 mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>Chỉ số BMI</h3>
                  {(() => {
                    const bmi = +(weight / ((height / 100) ** 2)).toFixed(1);
                    let bmiLabel = "", bmiColor = "";
                    if (bmi < 18.5) { bmiLabel = "Thiếu cân"; bmiColor = "text-blue-600"; }
                    else if (bmi < 25) { bmiLabel = "Bình thường"; bmiColor = "text-green-600"; }
                    else if (bmi < 30) { bmiLabel = "Thừa cân"; bmiColor = "text-yellow-600"; }
                    else { bmiLabel = "Béo phì"; bmiColor = "text-red-600"; }
                    const pct = Math.min(((bmi - 10) / 30) * 100, 100);
                    return (
                      <div>
                        <div className="flex items-end gap-3 mb-3">
                          <span className={bmiColor} style={{ fontSize: "2.5rem", fontWeight: 800 }}>{bmi}</span>
                          <span className={`${bmiColor} mb-1`} style={{ fontSize: "1rem", fontWeight: 600 }}>{bmiLabel}</span>
                        </div>
                        <div className="relative w-full h-4 rounded-full overflow-hidden mb-2" style={{ background: "linear-gradient(to right, #3b82f6 0%, #22c55e 30%, #eab308 60%, #ef4444 100%)" }}>
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-gray-800 rounded-full shadow" style={{ left: `${pct}%` }}></div>
                        </div>
                        <div className="flex justify-between text-gray-400" style={{ fontSize: "0.72rem" }}>
                          <span>Thiếu cân &lt;18.5</span>
                          <span>Bình thường 18.5-24.9</span>
                          <span>Thừa cân 25-29.9</span>
                          <span>Béo phì &gt;30</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Calories Burned */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontSize: "1rem", fontWeight: 700 }}>
                    <Dumbbell className="w-5 h-5 text-green-600" />
                    Calo Đốt Cháy Khi Tập
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-gray-700 mb-2 block" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Loại bài tập</label>
                      <select
                        value={exerciseType}
                        onChange={(e) => setExerciseType(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:border-green-500 transition-all"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {exerciseTypes.map((ex, i) => (
                          <option key={ex.label} value={i}>{ex.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-700 mb-2 block" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Thời gian (phút)</label>
                      <input
                        type="number"
                        value={duration}
                        min={5}
                        max={180}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:border-green-500 transition-all"
                        style={{ fontSize: "0.875rem" }}
                      />
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Flame className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1" style={{ fontSize: "0.85rem" }}>{exerciseTypes[exerciseType].label} trong {duration} phút</p>
                      <p className="text-orange-600" style={{ fontSize: "1.8rem", fontWeight: 800 }}>{burnedCalories} <span className="text-gray-500" style={{ fontSize: "1rem", fontWeight: 500 }}>kcal</span></p>
                      <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>≈ {Math.round(burnedCalories / 9)}g chất béo được đốt cháy</p>
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
