import { useCallback } from "react";
import { Link } from "react-router";
import { FileBarChart, MessageCircle, Plus, Search } from "lucide-react";
import type { MealLog, WorkoutEntry } from "../api";
import { AchievementsCard } from "../components/dashboard/AchievementsCard";
import { CalorieRing } from "../components/dashboard/CalorieRing";
import { CoachPlanCard } from "../components/dashboard/CoachPlanCard";
import { DailyGoalsCard } from "../components/dashboard/DailyGoalsCard";
import { DailyTip } from "../components/dashboard/DailyTip";
import { MacroProgress } from "../components/dashboard/MacroProgress";
import { MealLogCard } from "../components/dashboard/MealLogCard";
import { WaterTracker } from "../components/dashboard/WaterTracker";
import { WeeklyProgressCard } from "../components/dashboard/WeeklyProgressCard";
import { WeightTracking } from "../components/dashboard/WeightTracking";
import { WorkoutSection } from "../components/dashboard/WorkoutSection";
import { useDashboard } from "../hooks/useDashboard";

const quickActions = [
  {
    label: "Thêm bữa ăn",
    icon: Plus,
    color: "bg-green-600 text-white hover:bg-green-700",
    link: "/tracker",
  },
  {
    label: "Chat với AI",
    icon: MessageCircle,
    color:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    link: "/",
  },
  {
    label: "Tìm công thức",
    icon: Search,
    color:
      "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-200",
    link: "/recipes",
  },
  {
    label: "Báo cáo",
    icon: FileBarChart,
    color:
      "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200",
    link: "/reports",
  },
];

export function Dashboard() {
  const {
    dashboard,
    setDashboard,
    loading,
    error,
    coachPlan,
    coachLoading,
    coachMessage,
    generateCoachPlan,
  } = useDashboard();

  const handleMealLogUpdated = useCallback(
    (mealLog: MealLog) => {
      setDashboard((current) =>
        current ? { ...current, mealLog, nutrition: mealLog.summary } : current,
      );
    },
    [setDashboard],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-gray-500 dark:bg-slate-950 dark:text-slate-300">
        Đang tải dữ liệu dashboard...
      </div>
    );
  }
  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-red-600 dark:bg-slate-950 dark:text-red-300">
        {error ?? "Không có dữ liệu dashboard"}
      </div>
    );
  }

  const nutrition = dashboard.nutrition;
  const activity = dashboard.mealLog.activity;
  const workouts = (activity.workouts ??
    dashboard.mealLog.workouts ??
    []) as WorkoutEntry[];
  const waterTargetMl =
    nutrition.targets.waterMl ??
    Math.round(nutrition.targets.waterGlasses * 250);
  const initialWaterMl =
    dashboard.mealLog.waterMl ??
    Math.round(dashboard.mealLog.waterGlasses * 250);
  const weightTracking = dashboard.member.weightTracking;
  const currentWeightKg =
    weightTracking?.latestWeightKg ?? dashboard.member.weightKg ?? 65;
  const macros = [
    {
      name: "Protein",
      current: nutrition.totals.protein,
      target: nutrition.targets.protein,
      color: "#16a34a",
      unit: "g",
    },
    {
      name: "Carbs",
      current: nutrition.totals.carbs,
      target: nutrition.targets.carbs,
      color: "#3b82f6",
      unit: "g",
    },
    {
      name: "Chất béo",
      current: nutrition.totals.fat,
      target: nutrition.targets.fat,
      color: "#f59e0b",
      unit: "g",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-[1.6rem] font-extrabold text-gray-900 dark:text-slate-50">
              {dashboard.greeting} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">
              {dashboard.date} • Dữ liệu được tải từ backend
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto xl:grid-cols-4">
            {quickActions.map(({ label, icon: Icon, color, link }) => (
              <Link
                key={label}
                to={link}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${color}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <aside className="space-y-6 xl:col-span-3">
            <CalorieRing
              consumed={nutrition.totals.calories}
              target={nutrition.targets.calories}
              remaining={nutrition.remainingCalories}
              burned={activity.burnedCalories}
            />
            <WeightTracking
              currentWeightKg={currentWeightKg}
              targetWeightKg={weightTracking?.targetWeightKg ?? currentWeightKg}
              caloriesIn={nutrition.totals.calories}
              calorieTarget={nutrition.targets.calories}
              caloriesOut={Math.max(0, Number(activity.burnedCalories || 0))}
            />
            <MacroProgress items={macros} />
            <WaterTracker
              date={dashboard.date}
              initialWaterMl={initialWaterMl}
              targetMl={waterTargetMl}
              onMealLogUpdated={handleMealLogUpdated}
            />
            <DailyTip text={dashboard.tips[0] ?? ""} />
          </aside>

          <main className="space-y-6 xl:col-span-6">
            <MealLogCard meals={dashboard.mealLog.meals} />
            <WorkoutSection
              date={dashboard.date}
              activity={activity}
              workouts={workouts}
              setDashboard={setDashboard}
            />
          </main>

          <aside className="space-y-6 xl:col-span-3">
            <WeeklyProgressCard
              data={dashboard.weeklyProgress}
              access={dashboard.member.access}
            />
            <AchievementsCard achievements={dashboard.achievements} />
            <DailyGoalsCard goals={dashboard.mealLog.goals} />
            <CoachPlanCard
              canUseCoach={Boolean(dashboard.member.access?.aiCoach)}
              plan={coachPlan}
              loading={coachLoading}
              message={coachMessage}
              onGenerate={() => void generateCoachPlan()}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
