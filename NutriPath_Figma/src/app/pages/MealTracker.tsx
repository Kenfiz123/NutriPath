import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Droplets,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  addMealItem,
  deleteMealItem,
  estimateCustomFood,
  estimateFoodPhoto,
  getCustomFoodIngredients,
  getFoods,
  getMealLog,
  getPersonalizedRecipes,
  getSavedCustomFoods,
  saveCustomFoodEstimate,
  updateWater,
  type AddMealItemPayload,
  type CustomFoodEstimateResponse,
  type CustomFoodIngredientInput,
  type CustomFoodUnit,
  type Food,
  type FoodPhotoEstimate,
  type MealLog,
  type NutritionIngredient,
  type PersonalizedRecipe,
  type SavedCustomFood,
} from "../api";

const MACRO_COLORS = ["#16a34a", "#3b82f6", "#f59e0b"];

const mealStyles: Record<string, { icon: string; color: string; borderColor: string; headerBg: string }> = {
  breakfast: { icon: "S", color: "text-yellow-700", borderColor: "border-yellow-200", headerBg: "bg-yellow-50" },
  lunch: { icon: "T", color: "text-green-700", borderColor: "border-green-200", headerBg: "bg-green-50" },
  dinner: { icon: "D", color: "text-blue-700", borderColor: "border-blue-200", headerBg: "bg-blue-50" },
  snack: { icon: "P", color: "text-purple-700", borderColor: "border-purple-200", headerBg: "bg-purple-50" },
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

function getDayDiffFromToday(date: Date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.floor((startOfToday - startOfDate) / (24 * 60 * 60 * 1000));
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không đọc được ảnh món ăn"));
    reader.readAsDataURL(file);
  });
}

function recipeToMealItem(recipe: PersonalizedRecipe): AddMealItemPayload {
  return {
    name: recipe.name,
    calories: recipe.calories,
    protein: recipe.nutrition.protein,
    carbs: recipe.nutrition.carbs,
    fat: recipe.nutrition.fat,
    portion: `${recipe.servings || 1} phần - ${recipe.mealTime || "Công thức AI"}`,
    quantity: 1,
  };
}

interface CustomIngredientDraft extends CustomFoodIngredientInput {
  id: string;
}

function createCustomIngredientDraft(): CustomIngredientDraft {
  return {
    id: `ingredient-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    quantity: 1,
    unit: "gram",
    note: "",
  };
}

export function MealTracker() {
  const [mealLog, setMealLog] = useState<MealLog | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [savedAiRecipes, setSavedAiRecipes] = useState<PersonalizedRecipe[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(["breakfast", "lunch", "snack"]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [addMode, setAddMode] = useState<"foods" | "custom" | "aiRecipes">("foods");
  const [activeMealId, setActiveMealId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [customFood, setCustomFood] = useState<AddMealItemPayload>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    portion: "1 phần tự nấu",
    quantity: 1,
  });
  const [nutritionIngredients, setNutritionIngredients] = useState<NutritionIngredient[]>([]);
  const [customUnits, setCustomUnits] = useState<CustomFoodUnit[]>([]);
  const [customIngredientDrafts, setCustomIngredientDrafts] = useState<CustomIngredientDraft[]>([createCustomIngredientDraft()]);
  const [customServings, setCustomServings] = useState(1);
  const [customCookingMethod, setCustomCookingMethod] = useState("");
  const [customEstimate, setCustomEstimate] = useState<CustomFoodEstimateResponse | null>(null);
  const [customEstimateStatus, setCustomEstimateStatus] = useState<"idle" | "estimating" | "ready" | "error">("idle");
  const [customSaveStatus, setCustomSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedCustomFoods, setSavedCustomFoods] = useState<SavedCustomFood[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFileName, setPhotoFileName] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [photoMealId, setPhotoMealId] = useState("");
  const [photoEstimate, setPhotoEstimate] = useState<FoodPhotoEstimate | null>(null);
  const [photoAddableItem, setPhotoAddableItem] = useState<AddMealItemPayload | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const dateKey = toIsoDate(currentDate);

  useEffect(() => {
    setLoading(true);
    getMealLog(dateKey)
      .then((data) => {
        setMealLog(data);
        setPhotoMealId((current) => current || data.meals[0]?.id || "");
        setError(null);
        setSaveStatus("saved");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được nhật ký bữa ăn"))
      .finally(() => setLoading(false));
  }, [dateKey]);

  useEffect(() => {
    if (!showFoodSearch || addMode !== "foods") return;
    getFoods(searchQuery)
      .then((data) => setFoods(data._embedded.foods))
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được danh sách thực phẩm"));
  }, [showFoodSearch, addMode, searchQuery]);

  useEffect(() => {
    if (!showFoodSearch || addMode !== "aiRecipes") return;
    getPersonalizedRecipes()
      .then((data) => setSavedAiRecipes(data._embedded.recipes))
      .catch(() => setSavedAiRecipes([]));
  }, [showFoodSearch, addMode]);

  useEffect(() => {
    if (!showFoodSearch || addMode !== "custom") return;
    Promise.all([getCustomFoodIngredients(), getSavedCustomFoods()])
      .then(([ingredientData, savedData]) => {
        setNutritionIngredients(ingredientData._embedded.ingredients);
        setCustomUnits(ingredientData.units);
        setSavedCustomFoods(savedData._embedded.customFoods);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được dữ liệu món tự nấu"));
  }, [showFoodSearch, addMode]);

  const totals = mealLog?.summary.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targets = mealLog?.summary.targets ?? { calories: 1800, protein: 120, carbs: 220, fat: 60, waterGlasses: 8 };
  const trackerAccess = mealLog?.access;
  const isSvipAiPhotoMode = trackerAccess?.tier === "svip";
  const caloriePct = Math.min(Math.round((totals.calories / targets.calories) * 100), 100);
  const macroData = useMemo(
    () => [
      { name: "Protein", value: Math.round(totals.protein * 4) },
      { name: "Carbs", value: Math.round(totals.carbs * 4) },
      { name: "Chất béo", value: Math.round(totals.fat * 9) },
    ],
    [totals],
  );
  const canGoPrevious = trackerAccess ? getDayDiffFromToday(currentDate) + 1 < trackerAccess.mealHistoryDays : true;
  const estimatedAddableItem = customEstimate?.addableItem;

  const toggleSection = (id: string) => {
    setOpenSections((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const changeDate = (delta: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    setCurrentDate(next);
  };

  const handleAddFood = async (food: Food) => {
    if (!activeMealId) return;
    setSaveStatus("saving");
    try {
      const updated = await addMealItem(dateKey, activeMealId, food.id);
      setMealLog(updated);
      setShowFoodSearch(false);
      setSearchQuery("");
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Không lưu được món ăn");
    }
  };

  const updateCustomIngredientDraft = (id: string, patch: Partial<CustomIngredientDraft>) => {
    setCustomIngredientDrafts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setCustomEstimate(null);
    setCustomEstimateStatus("idle");
  };

  const handleAddCustomIngredientRow = () => {
    setCustomIngredientDrafts((current) => [...current, createCustomIngredientDraft()]);
  };

  const handleRemoveCustomIngredientRow = (id: string) => {
    setCustomIngredientDrafts((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : [createCustomIngredientDraft()]));
    setCustomEstimate(null);
    setCustomEstimateStatus("idle");
  };

  const handleEstimateCustomFood = async () => {
    const ingredients = customIngredientDrafts
      .filter((item) => item.name.trim())
      .map(({ name, quantity, unit, note }) => ({
        name: name.trim(),
        quantity: Math.max(0, Number(quantity) || 0),
        unit,
        note: note?.trim() || "",
      }));

    setCustomEstimateStatus("estimating");
    setCustomSaveStatus("idle");
    try {
      const result = await estimateCustomFood({
        name: customFood.name.trim(),
        servings: customServings,
        cookingMethod: customCookingMethod,
        ingredients,
      });
      setCustomEstimate(result);
      setCustomEstimateStatus("ready");
    } catch (err) {
      setCustomEstimateStatus("error");
      setError(err instanceof Error ? err.message : "Không ước tính được món tự nấu");
    }
  };

  const handleAddCustomFood = async () => {
    if (!activeMealId || !estimatedAddableItem) return;
    setSaveStatus("saving");
    try {
      const updated = await addMealItem(dateKey, activeMealId, estimatedAddableItem);
      setMealLog(updated);
      setShowFoodSearch(false);
      setCustomFood({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, portion: "1 phần tự nấu", quantity: 1 });
      setCustomIngredientDrafts([createCustomIngredientDraft()]);
      setCustomServings(1);
      setCustomCookingMethod("");
      setCustomEstimate(null);
      setCustomEstimateStatus("idle");
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Không lưu được món tự nấu");
    }
  };

  const handleSaveCustomFood = async () => {
    if (!customEstimate?.estimate || !customEstimate.addableItem) return;
    setCustomSaveStatus("saving");
    try {
      const saved = await saveCustomFoodEstimate({ estimate: customEstimate.estimate, addableItem: customEstimate.addableItem });
      setSavedCustomFoods((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setCustomSaveStatus("saved");
    } catch (err) {
      setCustomSaveStatus("error");
      setError(err instanceof Error ? err.message : "Không lưu được món cá nhân");
    }
  };

  const handleAddSavedCustomFood = async (food: SavedCustomFood) => {
    if (!activeMealId) return;
    setSaveStatus("saving");
    try {
      const updated = await addMealItem(dateKey, activeMealId, {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        portion: food.portion,
        quantity: 1,
      });
      setMealLog(updated);
      setShowFoodSearch(false);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Không thêm được món cá nhân đã lưu");
    }
  };

  const handleAddAiRecipe = async (recipe: PersonalizedRecipe) => {
    if (!activeMealId) return;
    setSaveStatus("saving");
    try {
      const updated = await addMealItem(dateKey, activeMealId, recipeToMealItem(recipe));
      setMealLog(updated);
      setShowFoodSearch(false);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Không lưu được công thức AI vào bữa ăn");
    }
  };

  const handleRemoveFood = async (mealId: string, itemId: string) => {
    setSaveStatus("saving");
    try {
      const updated = await deleteMealItem(dateKey, mealId, itemId);
      setMealLog(updated);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Không xóa được món ăn");
    }
  };

  const handleWater = async (next: number) => {
    if (!mealLog) return;
    const previous = mealLog;
    setSaveStatus("saving");
    setMealLog({ ...mealLog, waterGlasses: next });
    try {
      const updated = await updateWater(dateKey, next);
      setMealLog(updated);
      setSaveStatus("saved");
    } catch (err) {
      setMealLog(previous);
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Không lưu được lượng nước");
    }
  };

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Vui lòng chọn ảnh JPEG, PNG hoặc WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB");
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setPhotoPreview(dataUrl);
      setPhotoFileName(file.name);
      setPhotoEstimate(null);
      setPhotoAddableItem(null);
      setPhotoError(null);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Không đọc được ảnh món ăn");
    }
  };

  const handleEstimatePhoto = async () => {
    if (!photoPreview) {
      setPhotoError("Bạn cần chụp hoặc tải ảnh món ăn trước");
      return;
    }
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      const data = await estimateFoodPhoto({ imageDataUrl: photoPreview, notes: photoNotes });
      setPhotoEstimate(data.estimate);
      setPhotoAddableItem(data.addableItem);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Không nhận diện được calo từ ảnh");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleAddPhotoEstimate = async () => {
    if (!photoAddableItem || !photoMealId) return;
    setSaveStatus("saving");
    try {
      const updated = await addMealItem(dateKey, photoMealId, photoAddableItem);
      setMealLog(updated);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Không lưu được món ăn từ ảnh");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-gray-500">Đang tải nhật ký bữa ăn...</div>;
  }

  if (error || !mealLog) {
    return <div className="min-h-screen bg-gray-50 p-8 text-red-600">{error ?? "Không có dữ liệu nhật ký"}</div>;
  }

  const saveStatusText = {
    idle: "Tự động lưu",
    saving: "Đang lưu...",
    saved: "Đã lưu tự động",
    error: "Lưu thất bại",
  }[saveStatus];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="mb-1 text-gray-900" style={{ fontSize: "1.6rem", fontWeight: 800 }}>Nhật Ký Bữa Ăn</h1>
          <p className="text-gray-500" style={{ fontSize: "0.9rem" }}>Dữ liệu lấy từ backend theo ngày bạn chọn</p>
        </div>

        <div className="mb-4 flex justify-end">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
              saveStatus === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"
            }`}
            style={{ fontSize: "0.82rem", fontWeight: 700 }}
          >
            <Check className="h-4 w-4" />
            {saveStatusText}
          </div>
        </div>

        {trackerAccess && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-amber-900" style={{ fontSize: "0.92rem", fontWeight: 800 }}>
                  Gói {trackerAccess.tier.toUpperCase()} đang mở Meal Tracker trong {trackerAccess.mealHistoryDays} ngày gần nhất
                </p>
                <p className="mt-1 text-amber-800" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Tối đa {trackerAccess.mealItemsPerDay} món mỗi ngày, báo cáo dinh dưỡng {trackerAccess.analyticsWindowDays} ngày
                  {trackerAccess.reportExports ? " và xuất báo cáo." : "."}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-right">
                <p className="text-amber-900" style={{ fontSize: "1rem", fontWeight: 800 }}>
                  {trackerAccess.itemCount}/{trackerAccess.mealItemsPerDay}
                </p>
                <p className="text-amber-700" style={{ fontSize: "0.75rem" }}>món đã dùng hôm nay</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeDate(-1)}
                disabled={!canGoPrevious}
                className={`rounded-xl p-2 transition-colors ${canGoPrevious ? "bg-gray-100 hover:bg-gray-200" : "cursor-not-allowed bg-gray-100 text-gray-300"}`}
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <div className="rounded-xl border border-green-100 bg-green-50 px-5 py-2">
                <p className="text-green-700" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{formatDate(currentDate)}</p>
              </div>
              <button onClick={() => changeDate(1)} className="rounded-xl bg-gray-100 p-2 transition-colors hover:bg-gray-200">
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3 sm:gap-6">
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
          <div className="mb-2 flex justify-between">
            <span className="text-gray-600" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Tiến trình calo hôm nay</span>
            <span className="text-green-600" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{caloriePct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${caloriePct}%`, background: caloriePct >= 100 ? "#ef4444" : "linear-gradient(to right, #22c55e, #16a34a)" }} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            {mealLog.meals.map((meal) => {
              const style = mealStyles[meal.id] ?? { icon: "M", color: "text-gray-700", borderColor: "border-gray-200", headerBg: "bg-gray-50" };
              const isOpen = openSections.includes(meal.id);
              return (
                <div key={meal.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <button className={`flex w-full items-center justify-between p-5 ${style.headerBg} transition-opacity hover:opacity-90`} onClick={() => toggleSection(meal.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-white shadow-sm ${style.borderColor}`}>
                        <span className={style.color} style={{ fontSize: "0.95rem", fontWeight: 800 }}>{style.icon}</span>
                      </div>
                      <div className="text-left">
                        <p className={style.color} style={{ fontSize: "1rem", fontWeight: 700 }}>{meal.name}</p>
                        <p className="text-gray-500" style={{ fontSize: "0.78rem" }}>{meal.items.length} món · {meal.totalCalories} / {meal.targetKcal} kcal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-white shadow-inner">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min((meal.totalCalories / meal.targetKcal) * 100, 100)}%`, backgroundColor: meal.totalCalories > meal.targetKcal ? "#ef4444" : "#16a34a" }} />
                      </div>
                      <span className={`rounded-lg border px-2.5 py-1 ${style.headerBg} ${style.borderColor} ${style.color}`} style={{ fontSize: "0.8rem", fontWeight: 700 }}>{meal.totalCalories} kcal</span>
                      {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4">
                      {meal.items.length === 0 ? (
                        <div className="py-8 text-center text-gray-400">
                          <p style={{ fontSize: "0.9rem" }}>Chưa có món ăn nào</p>
                        </div>
                      ) : (
                        <div className="mb-3 space-y-2">
                          {meal.items.map((item) => (
                            <div key={item.id} className="group flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                                  <Check className="h-4 w-4 text-green-600" />
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
                                <span className="rounded-lg border border-green-100 bg-green-50 px-2.5 py-1 text-green-700" style={{ fontSize: "0.82rem", fontWeight: 700 }}>{item.calories} kcal</span>
                                <button onClick={() => handleRemoveFood(meal.id, item.id)} className="rounded-lg p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => { setActiveMealId(meal.id); setAddMode("foods"); setShowFoodSearch(true); }}
                        disabled={(trackerAccess?.remainingItemsForDay ?? 1) <= 0}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-2.5 transition-colors ${
                          (trackerAccess?.remainingItemsForDay ?? 1) > 0
                            ? `${style.borderColor} ${style.color} hover:bg-gray-50`
                            : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        }`}
                        style={{ fontSize: "0.875rem", fontWeight: 600 }}
                      >
                        <Plus className="h-4 w-4" />
                        Thêm món ăn
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-6 xl:col-span-4">
            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-green-700" style={{ fontSize: "0.75rem", fontWeight: 800 }}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {isSvipAiPhotoMode ? "SVIP Full AI" : "AI nhận diện ảnh"}
                  </div>
                  <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 800 }}>Chụp món ăn dự đoán calo</h3>
                  <p className="mt-1 text-gray-500" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                    {isSvipAiPhotoMode
                      ? "SVIP dùng AI Vision và AI Coach hiệu chỉnh theo hồ sơ để dự đoán calo tốt nhất."
                      : "Chụp rõ toàn bộ phần ăn, đủ sáng và thêm ghi chú khẩu phần để AI ước lượng chính xác hơn."}
                  </p>
                </div>
                <Camera className="h-5 w-5 flex-shrink-0 text-green-600" />
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-200 bg-green-50/60 px-4 py-5 text-center transition-colors hover:bg-green-50">
                {photoPreview ? (
                  <img src={photoPreview} alt="Ảnh món ăn cần ước lượng calo" className="mb-3 h-40 w-full rounded-xl object-cover" />
                ) : (
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                <span className="text-green-700" style={{ fontSize: "0.86rem", fontWeight: 800 }}>
                  {photoPreview ? "Đổi ảnh món ăn" : "Chụp hoặc tải ảnh món ăn"}
                </span>
                <span className="mt-1 line-clamp-1 text-gray-400" style={{ fontSize: "0.74rem" }}>
                  {photoFileName || "JPEG, PNG, WEBP dưới 5MB"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => void handlePhotoChange(event.target.files?.[0])}
                />
              </label>

              <textarea
                value={photoNotes}
                onChange={(event) => setPhotoNotes(event.target.value)}
                rows={2}
                placeholder="Ghi chú thêm: tô lớn/nhỏ, có sốt, ít cơm, ước lượng gram..."
                className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 outline-none focus:border-green-500 focus:bg-white"
                style={{ fontSize: "0.82rem", lineHeight: 1.5 }}
              />

              {photoError && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-600" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  {photoError}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleEstimatePhoto()}
                disabled={photoLoading || !photoPreview}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                style={{ fontSize: "0.88rem", fontWeight: 800 }}
              >
                <Sparkles className="h-4 w-4" />
                {photoLoading ? "Đang phân tích ảnh..." : "Dự đoán calo từ ảnh"}
              </button>

              {photoEstimate && (
                <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-green-100 bg-white px-2 py-0.5 text-green-700" style={{ fontSize: "0.7rem", fontWeight: 800 }}>
                        <Sparkles className="h-3 w-3" />
                        {photoEstimate.analysisMode === "svip_full_ai" ? "SVIP đã xử lý đa AI" : photoEstimate.analysisMode === "svip_vision_only" ? "SVIP AI Vision" : "AI Vision"}
                      </div>
                      <p className="text-gray-900" style={{ fontSize: "0.95rem", fontWeight: 800 }}>{photoEstimate.dishName}</p>
                      <p className="text-gray-500" style={{ fontSize: "0.78rem" }}>{photoEstimate.portion}</p>
                    </div>
                    <span className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-1 text-orange-700" style={{ fontSize: "0.82rem", fontWeight: 800 }}>
                      {photoEstimate.calories} kcal
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Tin cậy", value: `${photoEstimate.confidence}%` },
                      { label: "P", value: `${photoEstimate.protein}g` },
                      { label: "C", value: `${photoEstimate.carbs}g` },
                      { label: "F", value: `${photoEstimate.fat}g` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-white px-2 py-2">
                        <p className="text-gray-900" style={{ fontSize: "0.82rem", fontWeight: 800 }}>{item.value}</p>
                        <p className="text-gray-400" style={{ fontSize: "0.68rem" }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {photoEstimate.items.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {photoEstimate.items.slice(0, 4).map((item) => (
                        <div key={`${item.name}-${item.estimatedGrams}`} className="flex justify-between text-gray-500" style={{ fontSize: "0.76rem" }}>
                          <span>{item.name} · {item.estimatedGrams}g</span>
                          <span>{item.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {photoEstimate.refinedBy && photoEstimate.refinedBy.length > 0 && (
                    <p className="mt-3 text-green-700" style={{ fontSize: "0.72rem", lineHeight: 1.45 }}>
                      AI đã dùng: {photoEstimate.refinedBy.join(", ")}
                    </p>
                  )}
                  <p className="mt-3 text-gray-500" style={{ fontSize: "0.74rem", lineHeight: 1.45 }}>{photoEstimate.disclaimer}</p>
                  <div className="mt-3 flex gap-2">
                    <select
                      value={photoMealId}
                      onChange={(event) => setPhotoMealId(event.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 outline-none focus:border-green-500"
                      style={{ fontSize: "0.82rem", fontWeight: 700 }}
                    >
                      {mealLog.meals.map((meal) => (
                        <option key={meal.id} value={meal.id}>{meal.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleAddPhotoEstimate()}
                      disabled={!photoAddableItem || (trackerAccess?.remainingItemsForDay ?? 1) <= 0}
                      className="rounded-xl bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      style={{ fontSize: "0.82rem", fontWeight: 800 }}
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Tỉ lệ dinh dưỡng</h3>
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
                  <div className="mt-2 space-y-3">
                    {[
                      { name: "Protein", grams: Math.round(totals.protein), color: MACRO_COLORS[0] },
                      { name: "Carbs", grams: Math.round(totals.carbs), color: MACRO_COLORS[1] },
                      { name: "Chất béo", grams: Math.round(totals.fat), color: MACRO_COLORS[2] },
                    ].map((macro) => (
                      <div key={macro.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: macro.color }} />
                          <span className="text-gray-600" style={{ fontSize: "0.85rem" }}>{macro.name}</span>
                        </div>
                        <span className="text-gray-900" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{macro.grams}g</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-400" style={{ fontSize: "0.875rem" }}>Chưa có dữ liệu</div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>Nước uống</h3>
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mb-4 grid grid-cols-4 gap-2">
                {Array.from({ length: targets.waterGlasses }).map((_, i) => (
                  <button key={i} onClick={() => handleWater(i < mealLog.waterGlasses ? i : i + 1)} className={`flex aspect-square items-center justify-center rounded-xl transition-all ${i < mealLog.waterGlasses ? "bg-blue-500 text-white shadow-sm" : "bg-gray-100 text-gray-400 hover:bg-blue-100"}`}>
                    <Droplets className="h-5 w-5" />
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
                <p className="text-blue-700" style={{ fontSize: "1.2rem", fontWeight: 800 }}>{mealLog.waterGlasses * 250}ml</p>
                <p className="text-blue-500" style={{ fontSize: "0.78rem" }}>{mealLog.waterGlasses}/{targets.waterGlasses} ly · còn {(targets.waterGlasses - mealLog.waterGlasses) * 250}ml</p>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 p-5 text-white">
              <h3 className="mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>Tổng kết ngày</h3>
              <div className="space-y-3">
                {[
                  { label: "Calo tiêu thụ", value: `${totals.calories} kcal`, sub: `${targets.calories - totals.calories} kcal còn lại` },
                  { label: "Protein", value: `${Math.round(totals.protein)}g`, sub: `Mục tiêu: ${targets.protein}g` },
                  { label: "Carbohydrate", value: `${Math.round(totals.carbs)}g`, sub: `Mục tiêu: ${targets.carbs}g` },
                  { label: "Chất béo", value: `${Math.round(totals.fat)}g`, sub: `Mục tiêu: ${targets.fat}g` },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between border-b border-white/10 py-2 last:border-0">
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
          <div className="mx-4 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    Thêm món ăn - {mealLog.meals.find((meal) => meal.id === activeMealId)?.name}
                  </h3>
                  <p className="mt-1 text-gray-500" style={{ fontSize: "0.8rem" }}>
                    Chọn món có sẵn, nhập món tự nấu hoặc thêm công thức AI đã lưu vào nhật ký.
                  </p>
                </div>
                <button onClick={() => setShowFoodSearch(false)} className="rounded-xl p-2 transition-colors hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-2 rounded-2xl bg-gray-100 p-1 sm:grid-cols-3">
                {[
                  { id: "foods", label: "Kho món" },
                  { id: "custom", label: "Món tự nấu" },
                  { id: "aiRecipes", label: "Công thức AI" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAddMode(tab.id as typeof addMode)}
                    className={`rounded-xl px-3 py-2 transition ${addMode === tab.id ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    style={{ fontSize: "0.82rem", fontWeight: 800 }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {addMode === "foods" && (
                <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-3">
                  <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Tìm kiếm thực phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-gray-700 outline-none placeholder-gray-400"
                    style={{ fontSize: "0.9rem" }}
                  />
                </div>
              )}
            </div>

            <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: "470px" }}>
              {addMode === "foods" && (
                foods.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Search className="mx-auto mb-3 h-8 w-8 opacity-50" />
                    <p style={{ fontSize: "0.9rem" }}>Không tìm thấy thực phẩm</p>
                  </div>
                ) : (
                  foods.map((food) => (
                    <button key={food.id} onClick={() => handleAddFood(food)} className="flex w-full items-center justify-between border-b border-gray-50 p-4 transition-colors last:border-0 hover:bg-green-50">
                      <div className="text-left">
                        <p className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 600 }}>{food.name}</p>
                        <p className="text-gray-400" style={{ fontSize: "0.78rem" }}>{food.portion} · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg border border-green-100 bg-green-50 px-3 py-1 text-green-700" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{food.calories} kcal</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </button>
                  ))
                )
              )}

              {addMode === "custom" && (
                <div className="space-y-4 p-5">
                  <div>
                    <label className="mb-2 block text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Tên món ăn</label>
                    <input
                      value={customFood.name}
                      onChange={(event) => {
                        setCustomFood((current) => ({ ...current, name: event.target.value }));
                        setCustomEstimate(null);
                        setCustomEstimateStatus("idle");
                      }}
                      placeholder="Ví dụ: Cơm gà áp chảo"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 outline-none focus:border-green-500 focus:bg-white"
                      style={{ fontSize: "0.9rem" }}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                    <div>
                      <label className="mb-2 block text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Số phần ăn</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={customServings}
                        onChange={(event) => {
                          setCustomServings(Math.max(1, Number(event.target.value) || 1));
                          setCustomEstimate(null);
                          setCustomEstimateStatus("idle");
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 outline-none focus:border-green-500 focus:bg-white"
                        style={{ fontSize: "0.9rem", fontWeight: 800 }}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-gray-700" style={{ fontSize: "0.84rem", fontWeight: 700 }}>Cách nấu nếu có</label>
                      <input
                        value={customCookingMethod}
                        onChange={(event) => {
                          setCustomCookingMethod(event.target.value);
                          setCustomEstimate(null);
                          setCustomEstimateStatus("idle");
                        }}
                        placeholder="Ví dụ: áp chảo ít dầu, luộc, kho, xào..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 outline-none focus:border-green-500 focus:bg-white"
                        style={{ fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 900 }}>Nguyên liệu</p>
                      <button
                        type="button"
                        onClick={handleAddCustomIngredientRow}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-green-700 hover:bg-green-100"
                        style={{ fontSize: "0.78rem", fontWeight: 800 }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm nguyên liệu
                      </button>
                    </div>
                    <datalist id="custom-ingredient-options">
                      {nutritionIngredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.name} />
                      ))}
                    </datalist>
                    <div className="space-y-3">
                      {customIngredientDrafts.map((item, index) => (
                        <div key={item.id} className="grid min-w-0 gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-[minmax(0,1fr)_90px_145px_minmax(0,1fr)_34px]">
                          <input
                            list="custom-ingredient-options"
                            value={item.name}
                            onChange={(event) => updateCustomIngredientDraft(item.id, { name: event.target.value })}
                            placeholder={index === 0 ? "Ví dụ: cơm trắng" : "Nguyên liệu"}
                            className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800 outline-none focus:border-green-500"
                            style={{ fontSize: "0.82rem" }}
                          />
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={item.quantity}
                            onChange={(event) => updateCustomIngredientDraft(item.id, { quantity: Number(event.target.value) || 0 })}
                            className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-gray-800 outline-none focus:border-green-500"
                            style={{ fontSize: "0.82rem", fontWeight: 800 }}
                            aria-label={"Số lượng nguyên liệu " + (index + 1)}
                          />
                          <select
                            value={item.unit}
                            onChange={(event) => updateCustomIngredientDraft(item.id, { unit: event.target.value })}
                            className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800 outline-none focus:border-green-500"
                            style={{ fontSize: "0.82rem", fontWeight: 700 }}
                          >
                            {customUnits.map((unit) => (
                              <option key={unit.id} value={unit.id}>{unit.label}</option>
                            ))}
                          </select>
                          <input
                            value={item.note || ""}
                            onChange={(event) => updateCustomIngredientDraft(item.id, { note: event.target.value })}
                            placeholder="Ghi chú: bỏ da, ít dầu..."
                            className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800 outline-none focus:border-green-500"
                            style={{ fontSize: "0.82rem" }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomIngredientRow(item.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={"Xóa nguyên liệu " + (index + 1)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-gray-500" style={{ fontSize: "0.76rem", lineHeight: 1.5 }}>
                      Có thể nhập đơn vị đời thường như 1 chén cơm, 1 muỗng cà phê dầu ăn, 1 quả trứng, 1 miếng ức gà hoặc nhập gram để độ tin cậy cao hơn.
                    </p>
                  </div>

                  {savedCustomFoods.length > 0 && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="mb-3 text-amber-900" style={{ fontSize: "0.86rem", fontWeight: 900 }}>Món cá nhân đã lưu</p>
                      <div className="space-y-2">
                        {savedCustomFoods.slice(0, 4).map((food) => (
                          <button
                            key={food.id}
                            type="button"
                            onClick={() => void handleAddSavedCustomFood(food)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-left shadow-sm hover:bg-amber-100"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-gray-900" style={{ fontSize: "0.82rem", fontWeight: 800 }}>{food.name}</p>
                              <p className="truncate text-gray-500" style={{ fontSize: "0.72rem" }}>{food.portion} · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                            </div>
                            <span className="flex-shrink-0 rounded-lg bg-amber-100 px-2.5 py-1 text-amber-800" style={{ fontSize: "0.78rem", fontWeight: 900 }}>
                              {food.calories} kcal
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {customEstimate && (
                    <div className={"rounded-2xl border p-4 " + (customEstimate.needsMoreInfo ? "border-orange-100 bg-orange-50" : "border-green-100 bg-green-50")}>
                      {customEstimate.needsMoreInfo ? (
                        <div className="space-y-3">
                          <p className="text-orange-900" style={{ fontSize: "0.9rem", fontWeight: 900 }}>{customEstimate.question}</p>
                          {customEstimate.quickEstimate && (
                            <div className="rounded-xl bg-white px-3 py-3 text-orange-800 shadow-sm" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                              Ước tính nhanh: {customEstimate.quickEstimate.dishName} thường khoảng {customEstimate.quickEstimate.caloriesRange[0]}-{customEstimate.quickEstimate.caloriesRange[1]} kcal/phần. Độ tin cậy: {customEstimate.quickEstimate.confidence}.
                            </div>
                          )}
                          {customEstimate.unresolved && customEstimate.unresolved.length > 0 && (
                            <div className="space-y-1">
                              {customEstimate.unresolved.map((item, index) => (
                                <p key={item.inputName + "-" + index} className="text-orange-700" style={{ fontSize: "0.78rem" }}>
                                  {item.inputName || "Nguyên liệu trống"}: {item.reason}
                                </p>
                              ))}
                            </div>
                          )}
                          {(customEstimate.suggestions || []).map((suggestion) => (
                            <p key={suggestion} className="text-orange-700" style={{ fontSize: "0.78rem" }}>{suggestion}</p>
                          ))}
                        </div>
                      ) : customEstimate.estimate ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-green-950" style={{ fontSize: "0.95rem", fontWeight: 900 }}>
                                {customEstimate.estimate.dishName}
                              </p>
                              <p className="text-green-700" style={{ fontSize: "0.78rem" }}>
                                Độ tin cậy: {customEstimate.estimate.confidence.label} · {customEstimate.estimate.confidence.reason}
                              </p>
                            </div>
                            <span className="rounded-xl bg-white px-3 py-1.5 text-green-700 shadow-sm" style={{ fontSize: "0.84rem", fontWeight: 900 }}>
                              ~{customEstimate.estimate.perServing.calories} kcal/phần
                            </span>
                          </div>
                          <div className="space-y-2">
                            {customEstimate.estimate.ingredients.map((item) => (
                              <div key={item.inputName + "-" + item.grams} className="rounded-xl bg-white px-3 py-2 shadow-sm">
                                <div className="flex justify-between gap-3">
                                  <p className="text-gray-900" style={{ fontSize: "0.8rem", fontWeight: 800 }}>{item.matchedName}</p>
                                  <p className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 800 }}>{item.calories} kcal</p>
                                </div>
                                <p className="mt-0.5 text-gray-500" style={{ fontSize: "0.72rem" }}>
                                  {item.quantity} {item.unitLabel} ≈ {item.grams}g · P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {[
                              { label: "Calories", value: customEstimate.estimate.perServing.calories, unit: "kcal" },
                              { label: "Protein", value: customEstimate.estimate.perServing.protein, unit: "g" },
                              { label: "Carbs", value: customEstimate.estimate.perServing.carbs, unit: "g" },
                              { label: "Fat", value: customEstimate.estimate.perServing.fat, unit: "g" },
                            ].map((field) => (
                              <div key={field.label} className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                                <p className="text-gray-400" style={{ fontSize: "0.7rem", fontWeight: 800 }}>{field.label}</p>
                                <p className="mt-1 text-gray-900" style={{ fontSize: "0.95rem", fontWeight: 900 }}>{field.value} <span className="text-gray-400" style={{ fontSize: "0.68rem" }}>{field.unit}</span></p>
                              </div>
                            ))}
                          </div>
                          <p className="text-green-800" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>{customEstimate.estimate.disclaimer}</p>
                          {(customEstimate.estimate.suggestions || []).map((suggestion) => (
                            <p key={suggestion} className="text-green-700" style={{ fontSize: "0.76rem" }}>{suggestion}</p>
                          ))}
                          <div className="grid gap-3 md:grid-cols-3">
                            <button
                              type="button"
                              onClick={() => void handleSaveCustomFood()}
                              disabled={customSaveStatus === "saving"}
                              className="rounded-xl border border-green-200 bg-white px-4 py-3 text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ fontSize: "0.84rem", fontWeight: 900 }}
                            >
                              {customSaveStatus === "saved" ? "Đã lưu món này" : customSaveStatus === "saving" ? "Đang lưu..." : "Lưu món này"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomEstimate(null)}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50"
                              style={{ fontSize: "0.84rem", fontWeight: 900 }}
                            >
                              Chỉnh sửa nguyên liệu
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleAddCustomFood()}
                              className="rounded-xl bg-green-600 px-4 py-3 text-white hover:bg-green-700"
                              style={{ fontSize: "0.84rem", fontWeight: 900 }}
                            >
                              Thêm vào bữa
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-700" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                    Logic: app quy đổi đơn vị đời thường sang gram, sau đó tính Calories = gram × kcal/100g / 100. Kết quả luôn là ước tính và có thể dao động theo cách nấu thực tế.
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleEstimateCustomFood()}
                    disabled={!customFood.name.trim() || customEstimateStatus === "estimating"}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    style={{ fontSize: "0.9rem", fontWeight: 800 }}
                  >
                    <Plus className="h-4 w-4" />
                    {customEstimateStatus === "estimating" ? "Đang tính..." : "Tính calo món tự nấu"}
                  </button>
                </div>
              )}

              {addMode === "aiRecipes" && (
                savedAiRecipes.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Sparkles className="mx-auto mb-3 h-8 w-8 opacity-50" />
                    <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Chưa có công thức AI đã lưu</p>
                    <p className="mt-1" style={{ fontSize: "0.78rem" }}>Tạo công thức ở trang Công Thức, sau đó quay lại đây để thêm vào nhật ký.</p>
                  </div>
                ) : (
                  savedAiRecipes.map((recipe) => (
                    <button key={recipe.id} onClick={() => void handleAddAiRecipe(recipe)} className="flex w-full items-center justify-between gap-4 border-b border-gray-50 p-4 text-left transition-colors last:border-0 hover:bg-amber-50">
                      <div className="min-w-0">
                        <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700" style={{ fontSize: "0.68rem", fontWeight: 800 }}>
                          <Sparkles className="h-3 w-3" />
                          SVIP AI
                        </div>
                        <p className="line-clamp-2 text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 800 }}>{recipe.name}</p>
                        <p className="mt-1 text-gray-500" style={{ fontSize: "0.76rem" }}>
                          {recipe.timeMinutes} phút · {recipe.mealTime} · P:{recipe.nutrition.protein}g C:{recipe.nutrition.carbs}g F:{recipe.nutrition.fat}g
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <span className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-1 text-amber-700" style={{ fontSize: "0.82rem", fontWeight: 800 }}>{recipe.calories} kcal</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
