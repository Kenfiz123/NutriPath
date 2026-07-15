import { Check, Target } from "lucide-react";
import type { MealLog } from "../../api";

interface DailyGoalsCardProps {
  goals: MealLog["goals"];
}

export function DailyGoalsCard({ goals }: DailyGoalsCardProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 p-6 text-white">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-5 w-5 text-green-200" />
        <h2 className="text-sm font-bold">Mục tiêu hôm nay</h2>
      </div>
      <div className="space-y-2.5">
        {goals.map((goal) => (
          <div key={goal.label} className="flex items-center gap-2">
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${goal.done ? "bg-white" : "border-2 border-white/30 bg-white/20"}`}
            >
              {goal.done && <Check className="h-3 w-3 text-green-600" />}
            </div>
            <span
              className={`text-sm ${goal.done ? "text-white" : "text-green-100"}`}
            >
              {goal.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
