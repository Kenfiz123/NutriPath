import { useEffect, useState, type SyntheticEvent } from "react";
import { Link } from "react-router";
import { Search, X, Clock, Flame, Star, Filter, BookOpen, Users, Crown, Sparkles } from "lucide-react";
import { generatePersonalizedRecipe, getPersonalizedRecipes, getRecipes, type PersonalizedRecipe, type PersonalizedRecipeQuestion, type Recipe } from "../api";
import { useAuth } from "../auth";

type DisplayRecipe = Recipe | PersonalizedRecipe;

const difficultyLabels = ["", "Dễ", "Trung bình", "Khó"];
const RECIPE_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80";

function isPersonalizedRecipe(recipe: DisplayRecipe): recipe is PersonalizedRecipe {
  return "generatedBy" in recipe;
}

function handleRecipeImageError(event: SyntheticEvent<HTMLImageElement>) {
  if (event.currentTarget.src !== RECIPE_FALLBACK_IMAGE) {
    event.currentTarget.src = RECIPE_FALLBACK_IMAGE;
  }
}

export function Recipes() {
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("Tất cả");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedAiRecipes, setSavedAiRecipes] = useState<PersonalizedRecipe[]>([]);
  const [tags, setTags] = useState<string[]>(["Tất cả"]);
  const [selectedRecipe, setSelectedRecipe] = useState<DisplayRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipeAccess, setRecipeAccess] = useState<{ tier: string; recipeLimit: number | null; totalAvailable: number; upgradeRequired: boolean } | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiQuestions, setAiQuestions] = useState<PersonalizedRecipeQuestion[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiRecipeUnlocked = Boolean(session?.member?.access?.aiCoach || session?.member?.tier === "svip");

  useEffect(() => {
    setLoading(true);
    getRecipes(search, activeTag)
      .then((data) => {
        setRecipes(data._embedded.recipes);
        setRecipeAccess(data.access ?? null);
        setTags(["Tất cả", ...data.tags]);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được công thức"))
      .finally(() => setLoading(false));
  }, [search, activeTag]);

  useEffect(() => {
    if (!session?.member) {
      setSavedAiRecipes([]);
      return;
    }
    getPersonalizedRecipes()
      .then((data) => setSavedAiRecipes(data._embedded.recipes))
      .catch(() => setSavedAiRecipes([]));
  }, [session?.member?.id]);


  const handleGeneratePersonalizedRecipe = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const data = await generatePersonalizedRecipe({ prompt: aiPrompt, answers: aiAnswers });
      if (data.status === "needs_questions") {
        setAiQuestions(data.questions ?? []);
        return;
      }
      if (data.recipe) {
        setAiQuestions([]);
        setAiAnswers({});
        setSavedAiRecipes((current) => [data.recipe as PersonalizedRecipe, ...current.filter((recipe) => recipe.id !== data.recipe?.id)]);
        setSelectedRecipe(data.recipe);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Không tạo được công thức cá nhân hóa");
    } finally {
      setAiLoading(false);
    }
  };
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-1" style={{ fontSize: "1.6rem", fontWeight: 800 }}>Kho Công Thức Healthy</h1>
          <p className="text-gray-500" style={{ fontSize: "0.9rem" }}>Công thức được tải trực tiếp từ backend</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Tìm công thức, nguyên liệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                style={{ fontSize: "0.9rem" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2.5 rounded-xl border-2 transition-all ${
                    activeTag === tag
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                  style={{ fontSize: "0.85rem", fontWeight: 600 }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500" style={{ fontSize: "0.85rem" }}>
              {loading ? "Đang tải..." : <>Tìm thấy <strong className="text-gray-900">{recipes.length}</strong> công thức</>}
            </span>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-amber-50 via-green-50 to-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-amber-700" style={{ fontSize: "0.78rem", fontWeight: 800 }}>
                  <Crown className="h-4 w-4" />
                  SVIP AI Recipe
                </div>
                <h2 className="text-gray-900" style={{ fontSize: "1.15rem", fontWeight: 800 }}>Công Thức Cá Nhân Hóa Do AI Tạo Ra</h2>
                <p className="mt-1 max-w-2xl text-gray-600" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                  AI tạo công thức riêng cho mục tiêu, thời điểm ăn, nguyên liệu sẵn có, khối lượng từng món, macro và lưu ý an toàn.
                </p>
              </div>
              {!aiRecipeUnlocked && (
                <Link to="/checkout?plan=svip&billing=monthly" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-white hover:bg-amber-600" style={{ fontSize: "0.86rem", fontWeight: 800 }}>
                  <Sparkles className="h-4 w-4" />
                  Mở khóa SVIP
                </Link>
              )}
            </div>
          </div>

          {aiRecipeUnlocked ? (
            <div className="p-5">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-800 outline-none focus:border-green-500 focus:bg-white"
                placeholder="Ví dụ: Tôi muốn bữa trưa giảm mỡ, nhiều protein, có ức gà và khoai lang, nấu trong 25 phút..."
                style={{ fontSize: "0.92rem", lineHeight: 1.6 }}
              />

              {aiQuestions.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {aiQuestions.map((question) => (
                    <label key={question.id} className="block rounded-2xl border border-green-100 bg-green-50 p-4">
                      <span className="block text-green-800" style={{ fontSize: "0.82rem", fontWeight: 800 }}>{question.label}</span>
                      <span className="mt-1 block text-gray-600" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>{question.question}</span>
                      <input
                        value={aiAnswers[question.id] ?? ""}
                        onChange={(e) => setAiAnswers((current) => ({ ...current, [question.id]: e.target.value }))}
                        className="mt-3 w-full rounded-xl border border-green-100 bg-white px-3 py-2 text-gray-800 outline-none focus:border-green-500"
                        style={{ fontSize: "0.86rem" }}
                      />
                    </label>
                  ))}
                </div>
              )}

              {aiError && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-600" style={{ fontSize: "0.86rem", fontWeight: 600 }}>
                  {aiError}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-500" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                  Nếu thông tin chưa đủ, AI sẽ hỏi thêm vài câu trước khi tạo công thức.
                </p>
                <button
                  type="button"
                  onClick={handleGeneratePersonalizedRecipe}
                  disabled={aiLoading || (!aiPrompt.trim() && Object.keys(aiAnswers).length === 0)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  style={{ fontSize: "0.9rem", fontWeight: 800 }}
                >
                  <Sparkles className="h-4 w-4" />
                  {aiLoading ? "Đang tạo..." : aiQuestions.length ? "Tạo công thức từ câu trả lời" : "Tạo công thức AI"}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-amber-100 p-5">
              <p className="text-gray-600" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                Tính năng này chỉ dành cho SVIP vì AI cần dùng hồ sơ dinh dưỡng nâng cao và lịch sử ăn uống để cá nhân hóa rõ hơn.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 rounded-2xl p-5 mb-8">
            {error}
          </div>
        )}

        {recipeAccess?.upgradeRequired && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-amber-800" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              Gói Free chỉ xem {recipeAccess.recipeLimit} công thức đầu tiên.
            </p>
            <p className="mt-1 text-amber-700" style={{ fontSize: "0.86rem", lineHeight: 1.6 }}>
              Hiện có {recipeAccess.totalAvailable} công thức phù hợp với bộ lọc. Nâng cấp VIP hoặc SVIP để mở toàn bộ kho công thức.
            </p>
            <div className="mt-4 flex gap-3">
              <Link to="/pricing" className="rounded-xl bg-amber-500 px-4 py-2.5 text-white hover:bg-amber-600" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                Xem gói thành viên
              </Link>
              <Link to="/checkout?plan=vip&billing=monthly" className="rounded-xl border border-amber-300 px-4 py-2.5 text-amber-700 hover:bg-amber-100" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                Mở khóa VIP
              </Link>
            </div>
          </div>
        )}

        {savedAiRecipes.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>Công thức AI đã lưu</h2>
                <p className="text-gray-500" style={{ fontSize: "0.85rem" }}>Những công thức SVIP AI đã tạo sẽ nằm ở đây để xem lại sau khi đăng nhập.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 border border-amber-100" style={{ fontSize: "0.8rem", fontWeight: 800 }}>
                {savedAiRecipes.length} món
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedAiRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => setSelectedRecipe(recipe)}
                  className="group overflow-hidden rounded-2xl border border-amber-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex gap-4 p-4">
                    <img src={recipe.image || RECIPE_FALLBACK_IMAGE} onError={handleRecipeImageError} alt={recipe.name} className="h-24 w-24 flex-shrink-0 rounded-xl object-cover bg-amber-50" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700" style={{ fontSize: "0.72rem", fontWeight: 800 }}>
                        <Crown className="h-3.5 w-3.5" />
                        Saved SVIP
                      </div>
                      <h3 className="line-clamp-2 text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 800, lineHeight: 1.35 }}>{recipe.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-gray-500" style={{ fontSize: "0.76rem" }}>
                        <span>{recipe.calories} kcal</span>
                        <span>{recipe.timeMinutes} phút</span>
                        <span>{recipe.mealTime}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all text-left group"
            >
              <div className="relative overflow-hidden">
                <img src={recipe.image || RECIPE_FALLBACK_IMAGE} onError={handleRecipeImageError} alt={recipe.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-gray-900" style={{ fontSize: "0.78rem", fontWeight: 700 }}>{recipe.calories} kcal</span>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                  {recipe.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-green-600/90 text-white rounded-lg px-2 py-0.5" style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-gray-900 mb-3 line-clamp-2" style={{ fontSize: "0.9rem", fontWeight: 700, lineHeight: 1.4 }}>{recipe.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span style={{ fontSize: "0.78rem" }}>{recipe.timeMinutes} phút</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span style={{ fontSize: "0.78rem" }}>{recipe.servings} người</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5" title={difficultyLabels[recipe.difficulty]}>
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < recipe.difficulty ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                    ))}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-gray-500" style={{ fontSize: "0.75rem" }}>
                  <span>P: {recipe.nutrition.protein}g</span>
                  <span>C: {recipe.nutrition.carbs}g</span>
                  <span>F: {recipe.nutrition.fat}g</span>
                  <span>Xơ: {recipe.nutrition.fiber}g</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {!loading && recipes.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p style={{ fontSize: "1rem", fontWeight: 600 }}>Không tìm thấy công thức phù hợp</p>
            <p style={{ fontSize: "0.875rem" }}>Thử tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </div>

      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-3xl w-full max-w-3xl mx-4 overflow-hidden shadow-2xl my-auto">
            <div className="relative">
              <img src={selectedRecipe.image || RECIPE_FALLBACK_IMAGE} onError={handleRecipeImageError} alt={selectedRecipe.name} className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-white mb-2" style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1.3 }}>{selectedRecipe.name}</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-white/90"><Clock className="w-4 h-4" /><span style={{ fontSize: "0.85rem" }}>{selectedRecipe.timeMinutes} phút</span></div>
                  <div className="flex items-center gap-1.5 text-white/90"><Flame className="w-4 h-4 text-orange-300" /><span style={{ fontSize: "0.85rem" }}>{selectedRecipe.calories} kcal/phần</span></div>
                  <div className="flex items-center gap-1.5 text-white/90"><Users className="w-4 h-4" /><span style={{ fontSize: "0.85rem" }}>{selectedRecipe.servings} người ăn</span></div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isPersonalizedRecipe(selectedRecipe) && (
                <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-amber-700" style={{ fontSize: "0.8rem", fontWeight: 800 }}>
                      <Crown className="h-4 w-4" />
                      SVIP AI
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                      Thời gian ăn: {selectedRecipe.recommendedEatingTime}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                      Bữa: {selectedRecipe.mealTime}
                    </span>
                  </div>
                  <p className="mt-3 text-gray-700" style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>
                    {selectedRecipe.personalizationSummary}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontSize: "1rem", fontWeight: 700 }}>🥗 Nguyên liệu</h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <div key={`${ingredient.name}-${ingredient.amount}`} className="py-1.5 border-b border-gray-50">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-700" style={{ fontSize: "0.875rem" }}>{ingredient.name}</span>
                          <span className="text-green-600 bg-green-50 px-2.5 py-0.5 rounded-lg" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{ingredient.amount}</span>
                        </div>
                        {"note" in ingredient && ingredient.note && (
                          <p className="mt-1 text-gray-400" style={{ fontSize: "0.74rem", lineHeight: 1.4 }}>{ingredient.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontSize: "1rem", fontWeight: 700 }}>
                    <Flame className="w-4 h-4 text-orange-500" /> Thông tin dinh dưỡng
                  </h3>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    {[
                      { label: "Calo", value: `${selectedRecipe.calories} kcal`, color: "text-orange-600", bg: "bg-orange-50" },
                      { label: "Protein", value: `${selectedRecipe.nutrition.protein}g`, color: "text-green-600", bg: "bg-green-50" },
                      { label: "Carbohydrate", value: `${selectedRecipe.nutrition.carbs}g`, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Chất béo", value: `${selectedRecipe.nutrition.fat}g`, color: "text-yellow-600", bg: "bg-yellow-50" },
                      { label: "Chất xơ", value: `${selectedRecipe.nutrition.fiber}g`, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-gray-600" style={{ fontSize: "0.875rem" }}>{item.label}</span>
                        <span className={`${item.color} ${item.bg} px-3 py-0.5 rounded-lg`} style={{ fontSize: "0.875rem", fontWeight: 700 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="text-gray-900 mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>Hướng dẫn nấu</h3>
              <div className="space-y-3">
                {selectedRecipe.steps.map((step, i) => (
                  <div key={step} className="flex gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                    <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <p className="text-gray-700 mt-0.5" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>{step}</p>
                  </div>
                ))}
              </div>

              {isPersonalizedRecipe(selectedRecipe) && selectedRecipe.notes.length > 0 && (
                <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <h3 className="text-amber-900 mb-3" style={{ fontSize: "0.95rem", fontWeight: 800 }}>Lưu ý riêng</h3>
                  <div className="space-y-2">
                    {selectedRecipe.notes.map((note) => (
                      <p key={note} className="text-amber-800" style={{ fontSize: "0.85rem", lineHeight: 1.55 }}>
                        {note}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-2">
                {selectedRecipe.tags.map((tag) => (
                  <span key={tag} className="bg-green-50 text-green-700 border border-green-100 rounded-full px-3 py-1" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
