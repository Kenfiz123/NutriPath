import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  addWorkout,
  deleteWorkout,
  type DashboardData,
  type WorkoutInput,
} from "../api";

export type WorkoutFormState = Required<
  Pick<WorkoutInput, "type" | "durationMinutes">
> & {
  intensity: NonNullable<WorkoutInput["intensity"]>;
  distanceKm: number;
  speedKmh: number;
  inclinePct: number;
  manualCalories: number;
  notes: string;
};

const initialWorkoutForm: WorkoutFormState = {
  type: "cycling",
  durationMinutes: 30,
  intensity: "moderate",
  distanceKm: 0,
  speedKmh: 0,
  inclinePct: 0,
  manualCalories: 0,
  notes: "",
};

export function useWorkouts(
  date: string,
  setDashboard: Dispatch<SetStateAction<DashboardData | null>>,
) {
  const [workoutForm, setWorkoutForm] =
    useState<WorkoutFormState>(initialWorkoutForm);
  const [workoutSaving, setWorkoutSaving] = useState(false);
  const [workoutMessage, setWorkoutMessage] = useState<string | null>(null);

  const updateWorkoutForm = useCallback(
    <K extends keyof WorkoutFormState>(
      field: K,
      value: WorkoutFormState[K],
    ) => {
      setWorkoutForm((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const saveWorkout = useCallback(async () => {
    const durationMinutes = Math.round(
      Number(workoutForm.durationMinutes) || 0,
    );
    if (durationMinutes < 1) {
      setWorkoutMessage("Vui lòng nhập thời lượng tập luyện hợp lệ.");
      return;
    }

    const payload: WorkoutInput = {
      type: workoutForm.type,
      durationMinutes,
      intensity: workoutForm.intensity,
      notes: workoutForm.notes.trim(),
      useAi:
        workoutForm.type === "custom" || workoutForm.notes.trim().length >= 20,
    };
    if (workoutForm.distanceKm > 0)
      payload.distanceKm = Number(workoutForm.distanceKm);
    if (workoutForm.speedKmh > 0)
      payload.speedKmh = Number(workoutForm.speedKmh);
    if (workoutForm.type === "treadmill")
      payload.inclinePct = Math.max(0, Number(workoutForm.inclinePct) || 0);
    if (workoutForm.manualCalories > 0)
      payload.manualCalories = Math.round(Number(workoutForm.manualCalories));

    setWorkoutSaving(true);
    setWorkoutMessage(null);
    try {
      const data = await addWorkout(date, payload);
      setDashboard((current) =>
        current
          ? {
              ...current,
              mealLog: data.mealLog,
              nutrition: data.mealLog.summary,
            }
          : current,
      );
      setWorkoutMessage(
        `${data.workout.label}: ước tính ${data.workout.calories.toLocaleString("vi-VN")} kcal đã đốt.`,
      );
      setWorkoutForm((current) => ({
        ...current,
        durationMinutes: 30,
        distanceKm: 0,
        speedKmh: 0,
        manualCalories: 0,
        inclinePct: current.type === "treadmill" ? current.inclinePct : 0,
        notes: "",
      }));
    } catch (err) {
      setWorkoutMessage(
        err instanceof Error ? err.message : "Không lưu được bài tập.",
      );
    } finally {
      setWorkoutSaving(false);
    }
  }, [date, setDashboard, workoutForm]);

  const removeWorkout = useCallback(
    async (workoutId: string) => {
      setWorkoutMessage(null);
      try {
        const updated = await deleteWorkout(date, workoutId);
        setDashboard((current) =>
          current
            ? {
                ...current,
                mealLog: updated,
                nutrition: updated.summary,
              }
            : current,
        );
        setWorkoutMessage("Đã xóa bài tập khỏi ngày hôm nay.");
      } catch (err) {
        setWorkoutMessage(
          err instanceof Error ? err.message : "Không xóa được bài tập.",
        );
      }
    },
    [date, setDashboard],
  );

  return {
    workoutForm,
    workoutSaving,
    workoutMessage,
    updateWorkoutForm,
    saveWorkout,
    removeWorkout,
  };
}
