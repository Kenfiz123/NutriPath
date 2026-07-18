import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AiRecipeOptionsForm,
  buildAiRecipeRequestOptions,
  DEFAULT_AI_RECIPE_OPTIONS,
  type AiRecipeFormOptions,
} from "../app/components/recipes/AiRecipeOptionsForm";
import { LanguageProvider } from "../app/language";

function makeOptions(overrides: Partial<AiRecipeFormOptions> = {}): AiRecipeFormOptions {
  return { ...DEFAULT_AI_RECIPE_OPTIONS, ...overrides };
}

describe("AI recipe request options", () => {
  it("merges profile allergies with recipe-specific exclusions without duplicates", () => {
    const result = buildAiRecipeRequestOptions(
      makeOptions({
        cuisineStyle: "Nhật Bản",
        cookingMethod: "Hấp",
        mainIngredient: "cá hồi",
        secondaryIngredients: "cải bó xôi, nấm; cải bó xôi",
        allergies: "đậu phộng, sữa",
      }),
      ["tôm", "đậu phộng"],
    );

    expect(result).toMatchObject({
      cuisineStyle: "Nhật Bản",
      cookingMethod: "Hấp",
      mainIngredient: "cá hồi",
      secondaryIngredients: ["cải bó xôi", "nấm"],
      allergies: ["tôm", "đậu phộng", "sữa"],
      avoidIngredients: ["tôm", "đậu phộng", "sữa"],
    });
  });

  it("omits empty optional text fields while keeping numeric constraints", () => {
    const result = buildAiRecipeRequestOptions(makeOptions(), []);

    expect(result.goal).toBeUndefined();
    expect(result.mainIngredient).toBeUndefined();
    expect(result.secondaryIngredients).toBeUndefined();
    expect(result.allergies).toBeUndefined();
    expect(result.timeMinutes).toBe(30);
    expect(result.servings).toBe(1);
  });

  it("renders cuisine, cooking, ingredient, and allergy controls", () => {
    window.localStorage.setItem("nutripath_language", "vi");
    const onChange = vi.fn();

    render(
      <LanguageProvider>
        <AiRecipeOptionsForm
          value={makeOptions()}
          profileAllergies={["tôm"]}
          onChange={onChange}
        />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText("Kiểu ẩm thực")).toBeInTheDocument();
    expect(screen.getByLabelText("Cách chế biến")).toBeInTheDocument();
    expect(screen.getByLabelText("Nguyên liệu chính")).toBeInTheDocument();
    expect(screen.getByLabelText("Món dị ứng/cần tránh")).toBeInTheDocument();
    expect(screen.getByText(/Đã tự động dùng danh sách dị ứng trong hồ sơ: tôm/)).toBeInTheDocument();
  });
});
