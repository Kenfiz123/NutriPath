import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X, ChevronDown, ChevronUp, Droplets, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  addMealItem,
  deleteMealItem,
  getFoods,
  getMealLog,
  updateWater,
  type Food,
  type MealLog,
} from "../api";

const MACRO_COLORS = ["#16a34a", "#3b82f6", "#f59e0b"];

const mealStyles: Record<string, { icon: string; color: string; borderColor: string; headerBg: string }> = {
  breakfast: { icon: "🌅", color: "text-yellow-700", borderColor: "border-yellow-200", headerBg: "bg-yellow-50" },
  lunch: { icon: "☀️", color: "text-green-700", borderColor: "border-green-200", headerBg: "bg-green-50" },
  dinner: { icon: "🌙", color: "text-blue-700", borderColor: "border-blue-200", headerBg: "bg-blue-50" },
  snack: { icon: "🍊", color: "text-purple-700", borderColor: "border-purple-200", headerBg: "bg-purple-50" },
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" });
}

export function MealTracker() {
  const [mealLog, setMealLog] = useState<MealLog | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(["breakfast", "lunch", "snack"]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [activeMealId, setActiveMealId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 13));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateKey = toIsoDate(currentDate);

  useEffect(() => {
    setLoading(true);
    getMealLog(dateKey)
      .then((data) => {
        setMealLog(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được nhật ký bữa ăn"))
      .finally(() => setLoading(false));
  }, [dateKey]);

  useEffect(() => {
    if (!showFoodSearch) return;
    getFoods(searchQuery)
      .then((data) => setFoods(data._embedded.foods))
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được danh sách thực phẩm"));
  }, [showFoodSearch, searchQuery]);

  const totals = mealLog?.summary.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targets = mealLog?.summary.targets ?? { calories: 1800, protein: 120, carbs: 220, fat: 60, waterGlasses: 8 };
  const caloriePct = Math.min(Math.round((totals.calories / targets.calories) * 100), 100);
  const macroData = useMemo(() => [
    { name: "Protein", value: Math.round(totals.protein * 4) },
    { name: "Carbs", value: Math.round(totals.carbs * 4) },
    { name: "Chất béo", value: Math.round(totals.fat * 9) },
  ], [totals]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const changeDate = (delta: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    setCurrentDate(next);
  };

  const handleAddFood = async (food: Food) => {
    if (!activeMealId) return;
    const updated = await addMealItem(dateKey, activeMealId, food.id);
    setMealLog(updated);
    setShowFoodSearch(false);
    setSearchQuery("");
  };

  const handleRemoveFood = async (mealId: string, itemId: string) => {
    const updated = await deleteMealItem(dateKey, mealId, itemId);
    setMealLog(updated);
  };

  const handleWater = async (next: number) => {
    if (!mealLog) return;
    setMealLog({ ...mealLog, waterGlasses: next });
    const updated = await updateWater(dateKey, next);
    setMealLog(updated);
  };

  if (loading) {
    return <div className="bg-gray-50 min-h-screen p-8 text-gray-500">Đang tải nhật ký bữa ăn...</div>;
  }

  if (error || !mealLog) {
    return <div className="bg-gray-50 min-h-screen p-8 text-red-600">{error ?? "Không có dữ liệu nhật ký"}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-gray-900 mb-1" style={{ fontSize: "1.6rem", fontWeight: 800 }}>Nhật Ký Bữa Ăn</h1>
          <p className="text-gray-500" style={{ fontSize: "0.9rem" }}>Dữ liệu lấy từ backend theo ngày bạn chọn</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => changeDate(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="bg-green-50 px-5 py-2 rounded-xl border border-green-100">
                <p className="text-green-700" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{formatDate(currentDate)}</p>
              </div>
              <button onClick={() => changeDate(1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-6">
              {[
                { label: "Tiêu thụ", value: `${totals.calories} kcal`, color: "text-green-600" },
                { label: "Mục tiêu", value: `${targets.calories} kcal`, color: "text-gray-700" },
                { label: "Còn lại", value: `${targets.calories - totals.calories} kcal`, color: "text-blue-600" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={stat.color} style={{ fontSize: "1.1rem", fontWeight: 800 }}>{stat.value}</p>
                  <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Tiến trình calo hôm nay</span>
            <span className="text-green-600" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{caloriePct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${caloriePct}%`, background: caloriePct >= 100 ? "#ef4444" : "linear-gradient(to right, #22c55e, #16a34a)" }} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            {mealLog.meals.map((meal) => {
              const style = mealStyles[meal.id] ?? { icon: "🍽️", color: "text-gray-700", borderColor: "border-gray-200", headerBg: "bg-gray-50" };
              const isOpen = openSections.includes(meal.id);
              return (
                <div key={meal.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button className={`w-full flex items-center justify-between p-5 ${style.headerBg} hover:opacity-90 transition-opacity`} onClick={() => toggleSection(meal.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border ${style.borderColor}`}>
                        <span style={{ fontSize: "1.2rem" }}>{style.icon}</span>
                      </div>
                      <div className="text-left">
                        <p className={style.color} style={{ fontSize: "1rem", fontWeight: 700 }}>{meal.name}</p>
                        <p className="text-gray-500" style={{ fontSize: "0.78rem" }}>{meal.items.length} món • {meal.totalCalories} / {meal.targetKcal} kcal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min((meal.totalCalories / meal.targetKcal) * 100, 100)}%`, backgroundColor: meal.totalCalories > meal.targetKcal ? "#ef4444" : "#16a34a" }} />
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg ${style.headerBg} border ${style.borderColor} ${style.color}`} style={{ fontSize: "0.8rem", fontWeight: 700 }}>{meal.totalCalories} kcal</span>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4">
                      {meal.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p style={{ fontSize: "0.9rem" }}>Chưa có món ăn nào</p>
                        </div>
                      ) : (
                        <div className="space-y-2 mb-3">
                          {meal.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                                  <Check className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-gray-800" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.name}</p>
                                  <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>{item.portion}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex gap-3 text-gray-500" style={{ fontSize: "0.75rem" }}>
                                  <span>P: {item.protein}g</span>
                                  <span>C: {item.carbs}g</span>
                                  <span>F: {item.fat}g</span>
                                </div>
                                <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-100" style={{ fontSize: "0.82rem", fontWeight: 700 }}>{item.calories} kcal</span>
                                <button onClick={() => handleRemoveFood(meal.id, item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => { setActiveMealId(meal.id); setShowFoodSearch(true); }} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed ${style.borderColor} ${style.color} hover:bg-gray-50 transition-colors`} style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        <Plus className="w-4 h-4" />
                        Thêm món ăn
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-900 mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>Tỉ lệ dinh dưỡng</h3>
              {totals.calories > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                        {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(val: number) => [`${val} kcal`]} contentStyle={{ fontSize: "0.75rem", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 mt-2">
                    {[
                      { name: "Protein", grams: Math.round(totals.protein), color: MACRO_COLORS[0] },
                      { name: "Carbs", grams: Math.round(totals.carbs), color: MACRO_COLORS[1] },
                      { name: "Chất béo", grams: Math.round(totals.fat), color: MACRO_COLORS[2] },
                    ].map((macro) => (
                      <div key={macro.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                          <span className="text-gray-600" style={{ fontSize: "0.85rem" }}>{macro.name}</span>
                        </div>
                        <span className="text-gray-900" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{macro.grams}g</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400" style={{ fontSize: "0.875rem" }}>Chưa có dữ liệu</div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Nước uống</h3>
                <Droplets className="w-5 h-5 text-blue-500" />
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {Array.from({ length: targets.waterGlasses }).map((_, i) => (
                  <button key={i} onClick={() => handleWater(i < mealLog.waterGlasses ? i : i + 1)} className={`aspect-square rounded-xl flex items-center justify-center transition-all ${i < mealLog.waterGlasses ? "bg-blue-500 text-white shadow-sm" : "bg-gray-100 text-gray-400 hover:bg-blue-100"}`}>
                    <Droplets className="w-5 h-5" />
                  </button>
                ))}
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                <p className="text-blue-700" style={{ fontSize: "1.2rem", fontWeight: 800 }}>{mealLog.waterGlasses * 250}ml</p>
                <p className="text-blue-500" style={{ fontSize: "0.78rem" }}>{mealLog.waterGlasses}/{targets.waterGlasses} ly · còn {(targets.waterGlasses - mealLog.waterGlasses) * 250}ml</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-5 text-white">
              <h3 className="mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>Tổng kết ngày</h3>
              <div className="space-y-3">
                {[
                  { label: "Calo tiêu thụ", value: `${totals.calories} kcal`, sub: `${targets.calories - totals.calories} kcal còn lại` },
                  { label: "Protein", value: `${Math.round(totals.protein)}g`, sub: `Mục tiêu: ${targets.protein}g` },
                  { label: "Carbohydrate", value: `${Math.round(totals.carbs)}g`, sub: `Mục tiêu: ${targets.carbs}g` },
                  { label: "Chất béo", value: `${Math.round(totals.fat)}g`, sub: `Mục tiêu: ${targets.fat}g` },
                ].map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                    <div>
                      <p className="text-green-100" style={{ fontSize: "0.8rem" }}>{stat.label}</p>
                      <p className="text-green-300" style={{ fontSize: "0.7rem" }}>{stat.sub}</p>
                    </div>
                    <p className="text-white" style={{ fontSize: "1rem", fontWeight: 700 }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFoodSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-3xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                  Thêm món ăn — {mealLog.meals.find((meal) => meal.id === activeMealId)?.name}
                </h3>
                <button onClick={() => setShowFoodSearch(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input autoFocus type="text" placeholder="Tìm kiếm thực phẩm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400" style={{ fontSize: "0.9rem" }} />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              {foods.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p style={{ fontSize: "0.9rem" }}>Không tìm thấy thực phẩm</p>
                </div>
              ) : (
                foods.map((food) => (
                  <button key={food.id} onClick={() => handleAddFood(food)} className="w-full flex items-center justify-between p-4 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0">
                    <div className="text-left">
                      <p className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 600 }}>{food.name}</p>
                      <p className="text-gray-400" style={{ fontSize: "0.78rem" }}>{food.portion} • P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-lg" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{food.calories} kcal</span>
                      <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
