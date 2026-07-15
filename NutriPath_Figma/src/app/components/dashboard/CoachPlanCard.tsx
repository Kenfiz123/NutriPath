import { Crown, Sparkles } from "lucide-react";
import { Link } from "react-router";
import type { WeeklyCoachPlan } from "../../api";
import { useLanguage } from "../../language";

interface CoachPlanCardProps {
  canUseCoach: boolean;
  plan: WeeklyCoachPlan | null;
  loading: boolean;
  message: string | null;
  onGenerate: () => void;
}

export function CoachPlanCard({
  canUseCoach,
  plan,
  loading,
  message,
  onGenerate,
}: CoachPlanCardProps) {
  const { t } = useLanguage();
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
            <Crown className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">SVIP AI Coach</span>
          </div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-slate-50">
            {t("Kế hoạch tuần")}
          </h2>
        </div>
        <Sparkles className="h-5 w-5 text-amber-600" />
      </div>
      {canUseCoach ? (
        <>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {loading
              ? t("Đang tạo...")
              : plan
                ? t("Tạo lại kế hoạch")
                : t("Tạo kế hoạch 7 ngày")}
          </button>
          {message && (
            <p className="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
              {t(message)}
            </p>
          )}
          {plan ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900">
                <p className="text-sm font-bold text-gray-900 dark:text-slate-50">
                  {t(plan.title)}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-slate-300">
                  {t(plan.summary)}
                </p>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {plan.days.slice(0, 7).map((day) => (
                  <div
                    key={day.date}
                    className="rounded-xl bg-white p-3 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-50">
                        {t(day.label)}
                      </p>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-200">
                        {day.targetCalories} kcal
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-gray-500 dark:text-slate-300">
                      {t(day.focus)}
                    </p>
                    {day.meals.slice(0, 2).map((meal) => (
                      <p
                        key={`${day.date}-${meal.name}`}
                        className="text-xs leading-5 text-gray-700 dark:text-slate-200"
                      >
                        <strong>{t(meal.name)}:</strong> {t(meal.suggestion)}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-amber-900 dark:text-amber-100">
              {t("Tạo kế hoạch 7 ngày dựa trên mục tiêu calo, macro và nhật ký bữa ăn gần nhất.")}
            </p>
          )}
        </>
      ) : (
        <div className="rounded-xl bg-white/80 p-4 dark:bg-slate-900">
          <p className="text-sm font-bold text-gray-900 dark:text-slate-50">
            {t("AI Coach chỉ dành cho SVIP")}
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-slate-300">
            {t("Nâng cấp để tạo kế hoạch ăn uống 7 ngày cá nhân hóa.")}
          </p>
          <Link
            to="/svip"
            className="mt-3 inline-flex rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
          >
            {t("Mở SVIP")}
          </Link>
        </div>
      )}
    </section>
  );
}
