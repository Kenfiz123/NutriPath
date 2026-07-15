import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData, Member } from "../../api";

interface WeeklyProgressCardProps {
  data: DashboardData["weeklyProgress"];
  access?: Member["access"];
}

export function WeeklyProgressCard({ data, access }: WeeklyProgressCardProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-50">
          Tiến trình tuần
        </h2>
        <TrendingUp className="h-5 w-5 text-green-600" />
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{ fontSize: "0.75rem", borderRadius: "8px" }}
            formatter={(value: number) => [`${value} kcal`]}
          />
          <Bar dataKey="target" fill="#bbf7d0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="consumed" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  entry.consumed > entry.target
                    ? "#f87171"
                    : entry.consumed > 0
                      ? "#16a34a"
                      : "#cbd5e1"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-sm bg-green-600" />
          Thực tế
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-sm bg-green-100" />
          Mục tiêu
        </span>
      </div>
      {access && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-400/20 dark:bg-amber-500/10">
          <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
            Báo cáo theo gói {access.tier.toUpperCase()}
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-100">
            Mở lịch sử và phân tích trong {access.analyticsWindowDays} ngày
            {access.reportExports ? ", có xuất báo cáo." : "."}
          </p>
        </div>
      )}
    </section>
  );
}
