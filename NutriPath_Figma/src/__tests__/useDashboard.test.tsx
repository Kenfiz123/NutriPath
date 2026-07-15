import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  createWeeklyCoachPlan: vi.fn(),
  getDashboard: vi.fn(),
  getWeeklyCoachPlans: vi.fn(),
}));

vi.mock("../app/api", () => ({
  createWeeklyCoachPlan: apiMocks.createWeeklyCoachPlan,
  getDashboard: apiMocks.getDashboard,
  getWeeklyCoachPlans: apiMocks.getWeeklyCoachPlans,
}));

import { useDashboard } from "../app/hooks/useDashboard";

describe("useDashboard request lifecycle", () => {
  it("aborts the dashboard request when the hook unmounts", async () => {
    let capturedSignal: AbortSignal | undefined;
    apiMocks.getDashboard.mockImplementation(
      ({ signal }: { signal?: AbortSignal }) => new Promise((_resolve, reject) => {
        capturedSignal = signal;
        signal?.addEventListener("abort", () => {
          const error = new Error("Request aborted");
          error.name = "AbortError";
          reject(error);
        });
      }),
    );
    apiMocks.getWeeklyCoachPlans.mockReturnValue(new Promise(() => undefined));

    const { unmount } = renderHook(() => useDashboard());
    await waitFor(() => expect(apiMocks.getDashboard).toHaveBeenCalledTimes(1));

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
