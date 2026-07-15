import { Target } from "lucide-react";

interface WeightTrackingProps {
  currentWeightKg: number;
  targetWeightKg: number;
  caloriesIn: number;
  calorieTarget: number;
  caloriesOut: number;
}

export function WeightTracking({
  currentWeightKg,
  targetWeightKg,
  caloriesIn,
  calorieTarget,
  caloriesOut,
}: WeightTrackingProps) {
  const netCalories = caloriesIn - calorieTarget - caloriesOut;
  const weeklyWeightDelta = (netCalories * 7) / 7700;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-50">
          Theo dõi cân nặng
        </h2>
        <Target className="h-5 w-5 text-emerald-600" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
          <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-200">
            {currentWeightKg}kg
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-300">hiện tại</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-500/10">
          <p className="text-lg font-extrabold text-blue-700 dark:text-blue-200">
            {targetWeightKg}kg
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-300">mục tiêu</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-extrabold text-gray-700 dark:text-slate-100">
          Net hôm nay: {netCalories > 0 ? "+" : ""}
          {Math.round(netCalories).toLocaleString("vi-VN")} kcal
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-slate-300">
          Calo in {caloriesIn.toLocaleString("vi-VN")} - mục tiêu{" "}
          {calorieTarget.toLocaleString("vi-VN")} - calo out{" "}
          {caloriesOut.toLocaleString("vi-VN")}. Nếu giữ nhịp này 7 ngày, cân
          nặng có thể {weeklyWeightDelta >= 0 ? "tăng" : "giảm"} khoảng{" "}
          {Math.abs(weeklyWeightDelta).toFixed(2)}kg.
        </p>
      </div>
    </section>
  );
}
