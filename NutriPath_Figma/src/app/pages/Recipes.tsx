import { useEffect, useState } from "react";
import { Search, X, Clock, Flame, Star, Filter, BookOpen, Users } from "lucide-react";
import { getRecipes, type Recipe } from "../api";

const difficultyLabels = ["", "Dễ", "Trung bình", "Khó"];

export function Recipes() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("Tất cả");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [tags, setTags] = useState<string[]>(["Tất cả"]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getRecipes(search, activeTag)
      .then((data) => {
        setRecipes(data._embedded.recipes);
        setTags(["Tất cả", ...data.tags]);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được công thức"))
      .finally(() => setLoading(false));
  }, [search, activeTag]);

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

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 rounded-2xl p-5 mb-8">
            {error}
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
                <img src={recipe.image} alt={recipe.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
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
              <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-64 object-cover" />
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
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontSize: "1rem", fontWeight: 700 }}>🥗 Nguyên liệu</h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <div key={`${ingredient.name}-${ingredient.amount}`} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-700" style={{ fontSize: "0.875rem" }}>{ingredient.name}</span>
                        <span className="text-green-600 bg-green-50 px-2.5 py-0.5 rounded-lg" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{ingredient.amount}</span>
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
