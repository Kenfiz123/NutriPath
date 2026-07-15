import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/api", () => ({
  addWaterIntake: vi.fn(),
}));

import { addWaterIntake } from "../app/api";
import { useWaterTracker } from "../app/hooks/useWaterTracker";

describe("useWaterTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serializes rapid additions and keeps the final server total", async () => {
    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;
    vi.mocked(addWaterIntake)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }) as never,
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }) as never,
      );
    const onMealLogUpdated = vi.fn();
    const { result } = renderHook(() =>
      useWaterTracker({
        date: "2026-07-15",
        initialWaterMl: 0,
        onMealLogUpdated,
      }),
    );

    act(() => {
      result.current.addWater(250);
      result.current.addWater(330);
    });

    expect(result.current.waterMl).toBe(580);
    expect(addWaterIntake).toHaveBeenCalledTimes(1);
    expect(addWaterIntake).toHaveBeenNthCalledWith(1, "2026-07-15", 250);

    await act(async () => {
      resolveFirst({ waterMl: 250, waterGlasses: 1, summary: {} });
    });
    await waitFor(() => expect(addWaterIntake).toHaveBeenCalledTimes(2));
    expect(addWaterIntake).toHaveBeenNthCalledWith(2, "2026-07-15", 330);

    await act(async () => {
      resolveSecond({ waterMl: 580, waterGlasses: 2, summary: {} });
    });
    await waitFor(() => expect(result.current.waterSaving).toBe(false));

    expect(result.current.waterMl).toBe(580);
    expect(onMealLogUpdated).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid single-entry amounts without calling the API", () => {
    const { result } = renderHook(() =>
      useWaterTracker({
        date: "2026-07-15",
        initialWaterMl: 0,
        onMealLogUpdated: vi.fn(),
      }),
    );

    act(() => result.current.addWater(5001));

    expect(addWaterIntake).not.toHaveBeenCalled();
    expect(result.current.waterError).toContain("1 đến 3.000ml");
  });
});
