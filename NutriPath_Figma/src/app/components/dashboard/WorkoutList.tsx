import { Dumbbell, Trash2 } from "lucide-react";
import type { WorkoutEntry } from "../../api";

const confidenceLabels: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

interface WorkoutListProps {
  workouts: WorkoutEntry[];
  onDelete: (workoutId: string) => void;
}

export function WorkoutList({ workouts, onDelete }: WorkoutListProps) {
  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-slate-50">
          Bài tập đã ghi hôm nay
        </h3>
        <span className="text-xs text-gray-500 dark:text-slate-300">
          {workouts.length} mục
        </span>
      </div>
      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center dark:border-slate-700 dark:bg-slate-900">
          <Dumbbell className="mx-auto mb-2 h-6 w-6 text-green-500" />
          <p className="text-sm font-bold text-gray-700 dark:text-slate-100">
            Chưa có bài tập nào hôm nay
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500 dark:text-slate-300">
            Ghi đạp xe, chạy bộ, chạy máy có dốc, tập gym hoặc bài khác để
            dashboard tính calo đã đốt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold text-gray-900 dark:text-slate-50">
                      {workout.label}
                    </p>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[0.68rem] font-extrabold text-green-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                      {confidenceLabels[
                        String(workout.confidence || "medium")
                      ] || "Trung bình"}
                    </span>
                    {workout.source?.startsWith("ai:") && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-extrabold text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                        AI fallback
                      </span>
                    )}
                    {workout.source === "manual" && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.68rem] font-extrabold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                        Tự nhập
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
                    {workout.durationMinutes} phút
                    {workout.speedKmh ? ` • ${workout.speedKmh} km/h` : ""}
                    {workout.distanceKm ? ` • ${workout.distanceKm} km` : ""}
                    {workout.inclinePct ? ` • dốc ${workout.inclinePct}%` : ""}
                    {workout.met ? ` • MET ${workout.met}` : ""}
                  </p>
                  {workout.note && (
                    <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-slate-300">
                      {workout.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-base font-black text-orange-600 dark:text-orange-300">
                    {workout.calories.toLocaleString("vi-VN")} kcal
                  </p>
                  <button
                    type="button"
                    onClick={() => onDelete(workout.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50 dark:border-red-400/20 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/10"
                    aria-label={`Xóa ${workout.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
