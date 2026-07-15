import { Flame } from "lucide-react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { useLanguage } from "../../language";

interface CalorieRingProps {
  consumed: number;
  target: number;
  remaining: number;
  burned: number;
}

export function CalorieRing({
  consumed,
  target,
  remaining,
  burned,
}: CalorieRingProps) {
  const { t } = useLanguage();
  const progress = target > 0 ? Math.round((consumed / target) * 100) : 0;
  const chartProgress = Math.min(100, Math.max(0, progress));

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-50">
          {t("Calo hôm nay")}
        </h2>
        <Flame className="h-5 w-5 text-orange-500" />
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            data={[{ name: "progress", value: chartProgress, fill: "#16a34a" }]}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={8}
              background={{ fill: "#dcfce7" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.8rem] font-extrabold text-gray-900 dark:text-slate-50">
            {consumed}
          </span>
          <span className="text-xs text-gray-400">/ {target} kcal</span>
          <span className="mt-1 text-xs font-semibold text-green-600 dark:text-emerald-300">
            {progress}% {t("mục tiêu")}
          </span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-green-50 p-3 text-center dark:bg-emerald-500/10">
          <p className="text-lg font-bold text-green-700 dark:text-emerald-200">
            {remaining}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-300">
            {t("kcal còn lại")}
          </p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3 text-center dark:bg-orange-500/10">
          <p className="text-lg font-bold text-orange-600 dark:text-orange-300">
            {burned}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-300">
            {t("kcal đã đốt")}
          </p>
        </div>
      </div>
    </section>
  );
}
