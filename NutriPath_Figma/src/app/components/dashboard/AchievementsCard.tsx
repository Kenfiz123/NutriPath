import { Award } from "lucide-react";
import type { DashboardData } from "../../api";
import { useLanguage } from "../../language";

interface AchievementsCardProps {
  achievements: DashboardData["achievements"];
}

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  const { t } = useLanguage();
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-50">
          {t("Thành tích")}
        </h2>
        <Award className="h-5 w-5 text-yellow-500" />
      </div>
      <div className="space-y-3">
        {achievements.map((achievement, index) => (
          <div
            key={achievement.id}
            className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-slate-900"
          >
            <span className="text-2xl">
              {index === 0 ? "🔥" : index === 1 ? "💧" : "🎯"}
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-slate-50">
                {t(achievement.label)}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-300">
                {t(achievement.description)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
