import { useCallback, useEffect, useRef, useState } from "react";
import { addWaterIntake, type MealLog } from "../api";

interface UseWaterTrackerOptions {
  date: string;
  initialWaterMl: number;
  onMealLogUpdated: (mealLog: MealLog) => void;
}

export function useWaterTracker({
  date,
  initialWaterMl,
  onMealLogUpdated,
}: UseWaterTrackerOptions) {
  const [waterMl, setWaterMl] = useState(initialWaterMl);
  const [waterInputMl, setWaterInputMl] = useState(250);
  const [waterSaving, setWaterSaving] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);
  const confirmedMlRef = useRef(initialWaterMl);
  const pendingMlRef = useRef(0);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    confirmedMlRef.current = initialWaterMl;
    setWaterMl(initialWaterMl + pendingMlRef.current);
  }, [date, initialWaterMl]);

  const flushPendingWater = useCallback(async () => {
    if (processingRef.current || !date) return;
    processingRef.current = true;
    if (mountedRef.current) setWaterSaving(true);

    while (pendingMlRef.current > 0 && mountedRef.current) {
      const amountToSave = pendingMlRef.current;
      pendingMlRef.current = 0;

      try {
        const updated = await addWaterIntake(date, amountToSave);
        const serverWaterMl =
          updated.waterMl ?? Math.round(updated.waterGlasses * 250);
        confirmedMlRef.current = serverWaterMl;
        onMealLogUpdated(updated);
        setWaterError(null);
      } catch (err) {
        setWaterError(
          err instanceof Error ? err.message : "Không lưu được lượng nước.",
        );
      }

      if (mountedRef.current) {
        setWaterMl(confirmedMlRef.current + pendingMlRef.current);
      }
    }

    processingRef.current = false;
    if (mountedRef.current) setWaterSaving(false);
  }, [date, onMealLogUpdated]);

  const addWater = useCallback(
    (amountMl = waterInputMl) => {
      const safeAmount = Math.round(Number(amountMl) || 0);
      if (safeAmount < 1 || safeAmount > 3000) {
        setWaterError("Lượng nước mỗi lần phải từ 1 đến 3.000ml.");
        return;
      }

      setWaterError(null);
      pendingMlRef.current += safeAmount;
      setWaterMl((current) => current + safeAmount);
      void flushPendingWater();
    },
    [flushPendingWater, waterInputMl],
  );

  return {
    waterMl,
    waterInputMl,
    setWaterInputMl,
    waterSaving,
    waterError,
    addWater,
  };
}
