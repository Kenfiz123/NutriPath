import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  createWeeklyCoachPlan,
  getDashboard,
  getWeeklyCoachPlans,
  type DashboardData,
  type WeeklyCoachPlan,
} from "../api";

interface UseDashboardResult {
  dashboard: DashboardData | null;
  setDashboard: Dispatch<SetStateAction<DashboardData | null>>;
  loading: boolean;
  error: string | null;
  coachPlan: WeeklyCoachPlan | null;
  coachLoading: boolean;
  coachMessage: string | null;
  generateCoachPlan: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coachPlan, setCoachPlan] = useState<WeeklyCoachPlan | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setError(null);
      try {
        const data = await getDashboard();
        if (active) setDashboard(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Không tải được dữ liệu dashboard",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDashboard();
    getWeeklyCoachPlans()
      .then((data) => {
        if (active) setCoachPlan(data._embedded.coachPlans[0] ?? null);
      })
      .catch(() => undefined);
    window.addEventListener("nutripath:member-updated", loadDashboard);

    return () => {
      active = false;
      window.removeEventListener("nutripath:member-updated", loadDashboard);
    };
  }, []);

  const generateCoachPlan = useCallback(async () => {
    setCoachLoading(true);
    setCoachMessage(null);
    try {
      const data = await createWeeklyCoachPlan();
      setCoachPlan(data.plan);
      setCoachMessage("AI Coach đã tạo kế hoạch tuần mới.");
    } catch (err) {
      setCoachMessage(
        err instanceof Error ? err.message : "Không tạo được kế hoạch tuần.",
      );
    } finally {
      setCoachLoading(false);
    }
  }, []);

  return {
    dashboard,
    setDashboard,
    loading,
    error,
    coachPlan,
    coachLoading,
    coachMessage,
    generateCoachPlan,
  };
}
