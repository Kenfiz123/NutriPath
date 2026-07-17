import { access, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HEALTHY_VIETNAMESE_RECIPE_COUNT,
  healthyVietnameseRecipes,
} from "../src/data/vietnamese-recipes.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendPublicDirectory = path.resolve(
  scriptDirectory,
  "../../NutriPath_Figma/public",
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyRecipe(recipe, index) {
  const expectedNumber = String(index + 1).padStart(3, "0");
  const expectedId = `recipe-vn-${expectedNumber}`;

  assert(recipe.id === expectedId, `ID không liên tục tại ${expectedId}.`);
  assert(recipe.name?.trim(), `${expectedId} thiếu tên món.`);
  assert(recipe.cuisine === "Việt Nam", `${expectedId} sai loại ẩm thực.`);
  assert(recipe.isCurated === true, `${expectedId} chưa được đánh dấu curated.`);
  assert(recipe.servings >= 1, `${expectedId} thiếu số khẩu phần.`);
  assert(recipe.ingredients?.length >= 6, `${expectedId} cần ít nhất 6 nguyên liệu.`);
  assert(recipe.steps?.length >= 5, `${expectedId} cần ít nhất 5 bước nấu.`);
  assert(
    recipe.ingredients.every((item) => item.name?.trim() && item.amount?.trim()),
    `${expectedId} có nguyên liệu thiếu tên hoặc định lượng.`,
  );
  assert(
    recipe.steps.every((step) => step.trim().length >= 30),
    `${expectedId} có bước nấu chưa đủ chi tiết.`,
  );
  assert(
    Number.isFinite(recipe.calories) && recipe.calories >= 80 && recipe.calories <= 900,
    `${expectedId} có calories ngoài khoảng hợp lý.`,
  );
  assert(
    ["protein", "carbs", "fat", "fiber"].every(
      (key) => Number.isFinite(recipe.nutrition?.[key]) && recipe.nutrition[key] >= 0,
    ),
    `${expectedId} có macro không hợp lệ.`,
  );
  assert(
    recipe.image === `/images/recipes/vietnamese/${expectedId}.webp`,
    `${expectedId} có đường dẫn ảnh không đồng bộ.`,
  );

  const imagePath = path.join(frontendPublicDirectory, recipe.image.replace(/^\//, ""));
  await access(imagePath);
  const imageStats = await stat(imagePath);
  assert(imageStats.size >= 40_000, `${expectedId} có ảnh quá nhỏ hoặc bị lỗi.`);
}

assert(
  HEALTHY_VIETNAMESE_RECIPE_COUNT === 110,
  `Catalog cần đúng 110 món, hiện có ${HEALTHY_VIETNAMESE_RECIPE_COUNT}.`,
);

assert(
  new Set(healthyVietnameseRecipes.map((recipe) => recipe.id)).size === 110,
  "Catalog có ID công thức bị trùng.",
);
assert(
  new Set(healthyVietnameseRecipes.map((recipe) => recipe.name.toLocaleLowerCase("vi"))).size === 110,
  "Catalog có tên công thức bị trùng.",
);

await Promise.all(healthyVietnameseRecipes.map(verifyRecipe));

console.log(
  `Recipe data test passed: ${HEALTHY_VIETNAMESE_RECIPE_COUNT} món, đủ định lượng, hướng dẫn và ảnh WebP.`,
);
