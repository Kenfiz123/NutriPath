import { Droplets } from "lucide-react";
import type { MealLog } from "../../api";
import { useWaterTracker } from "../../hooks/useWaterTracker";

interface WaterTrackerProps {
  date: string;
  initialWaterMl: number;
  targetMl: number;
  onMealLogUpdated: (mealLog: MealLog) => void;
}

export function WaterTracker({
  date,
  initialWaterMl,
  targetMl,
  onMealLogUpdated,
}: WaterTrackerProps) {
  const {
    waterMl,
    waterInputMl,
    setWaterInputMl,
    waterSaving,
    waterError,
    addWater,
  } = useWaterTracker({ date, initialWaterMl, onMealLogUpdated });
  const progress =
    targetMl > 0 ? Math.min(100, Math.round((waterMl / targetMl) * 100)) : 0;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-50">
          Lượng nước
        </h2>
        <Droplets className="h-5 w-5 text-blue-500" />
      </div>
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-blue-50 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-center">
        <p className="text-xl font-extrabold text-gray-900 dark:text-slate-50">
          {waterMl.toLocaleString("vi-VN")}ml{" "}
          <span className="text-base font-normal text-gray-400">
            / {targetMl.toLocaleString("vi-VN")}ml
          </span>
        </p>
        <p className="mt-1 text-xs text-blue-500 dark:text-blue-300">
          {progress}% mục tiêu hôm nay{waterSaving ? " • đang đồng bộ" : ""}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[250, 330, 500, 700].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => addWater(amount)}
            className="rounded-xl border border-blue-100 bg-blue-50 px-2 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
          >
            +{amount}ml
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          aria-label="Lượng nước muốn thêm"
          type="number"
          min={1}
          max={3000}
          value={waterInputMl}
          onChange={(event) => setWaterInputMl(Number(event.target.value))}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
        />
        <button
          type="button"
          onClick={() => addWater()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Ghi
        </button>
      </div>
      {waterError && (
        <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
          {waterError}
        </p>
      )}
    </section>
  );
}
