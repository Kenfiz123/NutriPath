import {
  Activity,
  Bike,
  Droplets,
  Dumbbell,
  Gauge,
  Plus,
  Sparkles,
  Timer,
  WandSparkles,
  Zap,
} from "lucide-react";
import { VoiceInputButton } from "../VoiceInputButton";
import type { WorkoutFormState } from "../../hooks/useWorkouts";
import { useLanguage } from "../../language";

const workoutTypes = [
  {
    id: "cycling",
    label: "Đạp xe",
    icon: Bike,
    hint: "Ngoài trời hoặc xe đạp tại chỗ",
  },
  {
    id: "running",
    label: "Chạy bộ",
    icon: Activity,
    hint: "Có thể nhập quãng đường hoặc tốc độ",
  },
  {
    id: "treadmill",
    label: "Chạy máy",
    icon: Gauge,
    hint: "Có thêm tốc độ và góc dốc",
  },
  {
    id: "gym",
    label: "Tập gym",
    icon: Dumbbell,
    hint: "Tạ, máy, circuit hoặc full-body",
  },
  { id: "hiit", label: "HIIT", icon: Zap, hint: "Cường độ cao, nghỉ ngắn" },
  {
    id: "swimming",
    label: "Bơi",
    icon: Droplets,
    hint: "Bơi nhẹ đến bơi nhanh",
  },
  {
    id: "walking",
    label: "Đi bộ nhanh",
    icon: Activity,
    hint: "Đi bộ ngoài trời hoặc máy",
  },
  { id: "yoga", label: "Yoga", icon: Sparkles, hint: "Nhẹ, giãn cơ, phục hồi" },
  {
    id: "custom",
    label: "Bài khác",
    icon: WandSparkles,
    hint: "AI hỗ trợ nếu mô tả đủ rõ",
  },
] as const;

const intensityOptions = [
  { id: "light", label: "Nhẹ" },
  { id: "moderate", label: "Vừa" },
  { id: "hard", label: "Nặng" },
  { id: "very_hard", label: "Rất nặng" },
] as const;

interface WorkoutFormProps {
  form: WorkoutFormState;
  saving: boolean;
  message: string | null;
  workoutCalories: number;
  onChange: <K extends keyof WorkoutFormState>(
    field: K,
    value: WorkoutFormState[K],
  ) => void;
  onSubmit: () => void;
}

export function WorkoutForm({
  form,
  saving,
  message,
  workoutCalories,
  onChange,
  onSubmit,
}: WorkoutFormProps) {
  const { locale, t } = useLanguage();
  const selectedType =
    workoutTypes.find((type) => type.id === form.type) ?? workoutTypes[0];
  const SelectedIcon = selectedType.icon;
  const showMovementInputs = [
    "cycling",
    "running",
    "treadmill",
    "walking",
  ].includes(form.type);
  const showInclineInput = form.type === "treadmill";
  const inputClass =
    "h-[42px] w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none focus:border-green-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500";

  return (
    <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-1 dark:ring-emerald-400/20">
            <SelectedIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-900 dark:text-slate-50">
              {t("Ghi bài tập chi tiết")}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-300">
              {t(selectedType.hint)}
            </p>
          </div>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-green-700 dark:bg-emerald-500/15 dark:text-emerald-200">
          {t("{calories} kcal từ workout", {
            calories: Math.round(workoutCalories).toLocaleString(locale),
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        {workoutTypes.map(({ id, label, icon: Icon }) => {
          const active = form.type === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange("type", id)}
              className={`flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition ${
                active
                  ? "border-green-500 bg-white text-green-700 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-200"
                  : "border-transparent bg-white/70 text-gray-600 hover:border-green-200 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-400/50 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-extrabold">{t(label)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-gray-600 dark:text-slate-200">
            {t("Thời lượng")}
          </span>
          <div className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-slate-600 dark:bg-slate-950">
            <Timer className="h-4 w-4 text-gray-400" />
            <input
              type="number"
              min={1}
              max={600}
              value={form.durationMinutes}
              onChange={(event) =>
                onChange("durationMinutes", Number(event.target.value))
              }
              className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none dark:text-slate-50"
            />
            <span className="text-xs text-gray-400">{t("phút")}</span>
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-gray-600 dark:text-slate-200">
            {t("Cường độ")}
          </span>
          <select
            value={form.intensity}
            onChange={(event) =>
              onChange(
                "intensity",
                event.target.value as WorkoutFormState["intensity"],
              )
            }
            className={inputClass}
          >
            {intensityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {t(option.label)}
              </option>
            ))}
          </select>
        </label>

        {showMovementInputs && (
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-600 dark:text-slate-200">
              {t("Quãng đường")}
            </span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.distanceKm}
              onChange={(event) =>
                onChange("distanceKm", Number(event.target.value))
              }
              className={inputClass}
              placeholder="km"
            />
          </label>
        )}

        {showMovementInputs && (
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-600 dark:text-slate-200">
              {t("Tốc độ")}
            </span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.speedKmh}
              onChange={(event) =>
                onChange("speedKmh", Number(event.target.value))
              }
              className={inputClass}
              placeholder="km/h"
            />
          </label>
        )}

        {showInclineInput && (
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-600 dark:text-slate-200">
              {t("Góc dốc máy")}
            </span>
            <input
              type="number"
              min={0}
              max={40}
              step={0.5}
              value={form.inclinePct}
              onChange={(event) =>
                onChange("inclinePct", Number(event.target.value))
              }
              className={inputClass}
              placeholder="%"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-gray-600 dark:text-slate-200">
            {t("Calo tự nhập")}
          </span>
          <input
            type="number"
            min={0}
            max={5000}
            step={1}
            value={form.manualCalories}
            onChange={(event) =>
              onChange("manualCalories", Number(event.target.value))
            }
            className={inputClass}
            placeholder="kcal"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
        <div className="flex gap-2">
          <textarea
            value={form.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            className="min-h-[78px] min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-green-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-400"
            placeholder={t("Ví dụ: tập gym lưng xô 45 phút, nghỉ 60 giây mỗi set; hoặc chạy máy 30 phút tốc độ 8km/h dốc 5%...")}
          />
          <VoiceInputButton
            className="h-[78px] w-12 flex-shrink-0"
            onTranscript={(text) =>
              onChange("notes", `${form.notes} ${text}`.trim())
            }
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 lg:min-w-[150px]"
        >
          <Plus className="h-4 w-4" />
          {saving ? t("Đang tính...") : t("Tính & lưu")}
        </button>
      </div>

      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-slate-300">
        {t("Công thức mặc định dùng MET theo cân nặng, thời lượng và cường độ. Nếu nhập calo tự đo từ máy/đồng hồ, hệ thống sẽ dùng số đó; bài khác hoặc mô tả phức tạp có thể dùng AI để ước tính bảo thủ hơn.")}
      </p>
      {message && (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-green-700 dark:border dark:border-emerald-400/20 dark:bg-slate-950 dark:text-emerald-200">
          {t(message)}
        </p>
      )}
    </div>
  );
}
