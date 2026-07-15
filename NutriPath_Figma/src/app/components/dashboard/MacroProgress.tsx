export interface MacroProgressItem {
  name: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}

interface MacroProgressProps {
  items: MacroProgressItem[];
}

export function MacroProgress({ items }: MacroProgressProps) {
  const { t } = useLanguage();
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-slate-50">
        {t("Dinh dưỡng đa lượng")}
      </h2>
      <div className="space-y-4">
        {items.map((item) => {
          const progress =
            item.target > 0
              ? Math.min(100, (item.current / item.target) * 100)
              : 0;
          return (
            <div key={item.name}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-300">
                  {item.name}
                </span>
                <span className="font-semibold text-gray-900 dark:text-slate-50">
                  {item.current}/{item.target}
                  {item.unit}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
import { useLanguage } from "../../language";
