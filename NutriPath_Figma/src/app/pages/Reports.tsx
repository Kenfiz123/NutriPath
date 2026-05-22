import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Activity,
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  Crown,
  Droplets,
  Flame,
  PieChart,
  TrendingUp,
  Utensils,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { exportNutritionReport, getNutritionReport, type NutritionReport } from "../api";

const dayOptions = [7, 30, 90];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function downloadTextFile(filename: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: mimeType || "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Reports() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getNutritionReport({ days })
      .then((data) => {
        if (!active) return;
        setReport(data);
        setExportMessage(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không tải được báo cáo dinh dưỡng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [days]);

  const chartData = useMemo(() => report?.daily.map((day) => ({
    ...day,
    label: new Date(day.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
  })) ?? [], [report]);

  const macroPie = useMemo(() => {
    if (!report) return [];
    return [
      { name: "Protein", value: report.averages.protein, color: "#22c55e" },
      { name: "Carbs", value: report.averages.carbs, color: "#3b82f6" },
      { name: "Fat", value: report.averages.fat, color: "#f59e0b" },
    ].filter((item) => item.value > 0);
  }, [report]);

  const handleExport = async () => {
    if (!report) return;
    setExporting(true);
    setExportMessage(null);
    try {
      const data = await exportNutritionReport({ days: report.range.days, endDate: report.range.to });
      downloadTextFile(data.filename, data.mimeType, data.content);
      setExportMessage("Đã xuất báo cáo CSV thành công.");
    } catch (err) {
      setExportMessage(err instanceof Error ? err.message : "Không xuất được báo cáo.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-500 dark:bg-slate-950 dark:text-slate-300">Đang tải báo cáo...</div>;
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error ?? "Không có dữ liệu báo cáo."}
        </div>
      </div>
    );
  }

  const canExport = Boolean(report.access.reportExports);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-green-700 dark:bg-green-500/15 dark:text-green-300">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-bold">Báo cáo dinh dưỡng</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">Theo dõi tiến trình thật của bạn</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
              Tổng hợp calo, macro, nước, vận động và món ăn từ nhật ký bữa ăn trong quyền lịch sử của gói hiện tại.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              {dayOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    days === option
                      ? "bg-green-600 text-white shadow"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {option} ngày
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={!canExport || exporting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-green-600 dark:hover:bg-green-500 dark:disabled:bg-slate-700"
            >
              <ArrowDownToLine className="h-4 w-4" />
              {exporting ? "Đang xuất..." : "Xuất CSV"}
            </button>
          </div>
        </div>

        {report.range.limitedByPlan && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Gói {report.access.tier.toUpperCase()} chỉ mở báo cáo trong {report.access.analyticsWindowDays} ngày gần nhất. Nâng cấp để xem dài hơn.
          </div>
        )}

        {!canExport && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200 sm:flex-row sm:items-center sm:justify-between">
            <span>Xuất báo cáo là quyền SVIP. Bạn vẫn xem được phân tích trong {report.access.analyticsWindowDays} ngày của gói hiện tại.</span>
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 font-bold text-white hover:bg-green-700">
              <Crown className="h-4 w-4" />
              Nâng cấp
            </Link>
          </div>
        )}

        {exportMessage && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {exportMessage}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Calo TB/ngày", value: report.averages.calories, unit: "kcal", icon: Flame, tone: "text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-300" },
            { label: "Ngày có ghi bữa", value: `${report.adherence.trackedDays}/${report.range.days}`, unit: "ngày", icon: CalendarDays, tone: "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-300" },
            { label: "Đạt mục tiêu calo", value: `${report.adherence.onTargetPct}%`, unit: "trong kỳ", icon: TrendingUp, tone: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300" },
            { label: "Nước TB/ngày", value: report.averages.waterGlasses, unit: "ly", icon: Droplets, tone: "text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-300" },
          ].map(({ label, value, unit, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-3xl font-extrabold text-slate-950 dark:text-slate-50">{value}</span>
                <span className="pb-1 text-sm text-slate-400 dark:text-slate-400">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-50">Calo theo ngày</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {formatDate(report.range.from)} - {formatDate(report.range.to)}
                </p>
              </div>
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={310}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="calorieTarget" name="Mục tiêu" stroke="#86efac" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="calories" name="Thực tế" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-50">Macro trung bình</h2>
              <PieChart className="h-5 w-5 text-green-600" />
            </div>
            {macroPie.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <RePieChart>
                  <Pie data={macroPie} dataKey="value" innerRadius={54} outerRadius={86} paddingAngle={3}>
                    {macroPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}g`]} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[230px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Chưa đủ dữ liệu macro.
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {macroPie.map((item) => (
                <div key={item.name} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-300">{item.name}</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-slate-50">{item.value}g</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-50">Calo theo bữa</h2>
              <Utensils className="h-5 w-5 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={report.mealBreakdown} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="calories" name="Calo" radius={[8, 8, 0, 0]}>
                  {report.mealBreakdown.map((_, index) => (
                    <Cell key={index} fill={["#22c55e", "#f59e0b", "#3b82f6", "#a855f7"][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-5">
            <h2 className="mb-4 text-lg font-extrabold text-slate-950 dark:text-slate-50">Món xuất hiện nhiều</h2>
            <div className="space-y-3">
              {report.topFoods.length ? report.topFoods.map((food, index) => (
                <div key={`${food.name}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950 dark:text-slate-50">{food.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{food.count} lần ghi</p>
                  </div>
                  <span className="text-sm font-extrabold text-green-600 dark:text-green-300">{food.calories} kcal</span>
                </div>
              )) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  Chưa có món ăn nào trong kỳ báo cáo.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-500/30 dark:bg-green-500/10 xl:col-span-12">
            <h2 className="mb-3 text-lg font-extrabold text-green-900 dark:text-green-100">Nhận xét nhanh</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {report.insights.map((insight) => (
                <div key={insight} className="rounded-xl bg-white/80 px-4 py-3 text-sm font-semibold leading-6 text-green-900 dark:bg-slate-900/70 dark:text-green-100">
                  {insight}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
