import { Apple, Check, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router";
import type { MealSection } from "../../api";
import { useLanguage } from "../../language";

const mealIcons: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍊",
};

const mealThemes: Record<
  string,
  { color: string; border: string; iconBg: string }
> = {
  breakfast: {
    color: "bg-yellow-50 dark:bg-yellow-500/10",
    border: "border-yellow-200 dark:border-yellow-400/20",
    iconBg: "bg-yellow-100 dark:bg-yellow-500/15",
  },
  lunch: {
    color: "bg-green-50 dark:bg-emerald-500/10",
    border: "border-green-200 dark:border-emerald-400/20",
    iconBg: "bg-green-100 dark:bg-emerald-500/15",
  },
  dinner: {
    color: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-400/20",
    iconBg: "bg-blue-100 dark:bg-blue-500/15",
  },
  snack: {
    color: "bg-purple-50 dark:bg-purple-500/10",
    border: "border-purple-200 dark:border-purple-400/20",
    iconBg: "bg-purple-100 dark:bg-purple-500/15",
  },
};

interface MealLogCardProps {
  meals: MealSection[];
}

export function MealLogCard({ meals: mealSections }: MealLogCardProps) {
  const { t } = useLanguage();
  const meals = mealSections
    .filter((meal) => meal.items.length > 0)
    .map((meal) => ({
      type: meal.name,
      time: meal.time,
      icon: mealIcons[meal.id] ?? "🍽️",
      kcal: meal.totalCalories,
      items: meal.items.map(
        (item) => `${item.name} ${item.portion} (${item.calories} kcal)`,
      ),
      ...(mealThemes[meal.id] ?? {
        color: "bg-gray-50 dark:bg-slate-900",
        border: "border-gray-200 dark:border-slate-700",
        iconBg: "bg-gray-100 dark:bg-slate-800",
      }),
    }));

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-50">
          {t("Nhật ký bữa ăn hôm nay")}
        </h2>
        <Link
          to="/tracker"
          className="flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 dark:text-emerald-300"
        >
          {t("Xem tất cả")} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-4">
        {meals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <Apple className="mx-auto mb-3 h-8 w-8 text-green-500" />
            <p className="text-sm font-bold text-gray-900 dark:text-slate-50">
              {t("Hôm nay chưa có bữa ăn nào")}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-slate-300">
              {t("Thêm món ở Meal Tracker để dashboard cập nhật calo, macro và tiến trình tuần theo dữ liệu thật.")}
            </p>
            <Link
              to="/tracker"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" /> {t("Thêm bữa ăn")}
            </Link>
          </div>
        )}
        {meals.map((meal) => (
          <article
            key={meal.type}
            className={`${meal.color} ${meal.border} rounded-2xl border p-4`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${meal.iconBg}`}
                >
                  <span className="text-lg">{meal.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-50">
                    {t(meal.type)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">
                    {meal.time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-slate-50">
                  {meal.kcal}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    kcal
                  </span>
                </p>
                <Link
                  to="/tracker"
                  className="text-xs font-medium text-green-600 dark:text-emerald-300"
                >
                  {t("+ Thêm")}
                </Link>
              </div>
            </div>
            <div className="space-y-1">
              {meal.items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                  <span className="text-xs text-gray-600 dark:text-slate-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
