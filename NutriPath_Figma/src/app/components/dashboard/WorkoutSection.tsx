import { Activity } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { DashboardData, MealLog, WorkoutEntry } from "../../api";
import { useWorkouts } from "../../hooks/useWorkouts";
import { WorkoutForm } from "./WorkoutForm";
import { WorkoutList } from "./WorkoutList";
import { useLanguage } from "../../language";

interface WorkoutSectionProps {
  date: string;
  activity: MealLog["activity"];
  workouts: WorkoutEntry[];
  setDashboard: Dispatch<SetStateAction<DashboardData | null>>;
}

export function WorkoutSection({
  date,
  activity,
  workouts,
  setDashboard,
}: WorkoutSectionProps) {
  const { locale, t } = useLanguage();
  const {
    workoutForm,
    workoutSaving,
    workoutMessage,
    updateWorkoutForm,
    saveWorkout,
    removeWorkout,
  } = useWorkouts(date, setDashboard);
  const workoutCalories =
    activity.workoutCalories ??
    workouts.reduce((sum, workout) => sum + (Number(workout.calories) || 0), 0);
  const stats = [
    {
      label: "Đi bộ",
      value: activity.steps.toLocaleString(locale),
      unit: "bước",
      icon: "🚶",
      color: "text-green-700",
    },
    {
      label: "Đốt cháy",
      value: activity.burnedCalories.toLocaleString(locale),
      unit: "kcal",
      icon: "🔥",
      color: "text-orange-700",
    },
    {
      label: "Thời gian",
      value: activity.activeMinutes.toLocaleString(locale),
      unit: "phút",
      icon: "⏱️",
      color: "text-blue-700",
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-50">
            {t("Hoạt động thể chất")}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
            {t("Nhập bài tập để hệ thống ước tính calo đã dùng.")}
          </p>
        </div>
        <Activity className="h-5 w-5 text-green-600" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-gray-50 p-4 text-center dark:bg-slate-900"
          >
            <div className="mb-2 text-2xl">{stat.icon}</div>
            <p
              className={`text-xl font-extrabold ${stat.color} dark:text-slate-50`}
            >
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t(stat.unit)}
            </p>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-300">
              {t(stat.label)}
            </p>
          </div>
        ))}
      </div>
      <WorkoutForm
        form={workoutForm}
        saving={workoutSaving}
        message={workoutMessage}
        workoutCalories={workoutCalories}
        onChange={updateWorkoutForm}
        onSubmit={() => void saveWorkout()}
      />
      <WorkoutList
        workouts={workouts}
        onDelete={(workoutId) => void removeWorkout(workoutId)}
      />
    </section>
  );
}
