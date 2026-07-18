import assert from "node:assert/strict";
import {
  collectRecipeAvoidanceTerms,
  findRecipeAvoidanceMatches,
} from "../src/app.js";

const member = {
  preferences: {
    allergies: ["tôm", "đậu phộng"],
    dislikedFoods: ["hành sống"],
  },
};

const avoidanceTerms = collectRecipeAvoidanceTerms(
  member,
  { avoidIngredients: "sữa; mè" },
  { allergies: ["trứng", "tôm"] },
);

assert.deepEqual(
  avoidanceTerms,
  ["tôm", "đậu phộng", "hành sống", "sữa", "mè", "trứng"],
  "Profile and request exclusions must be merged without duplicates.",
);

const matches = findRecipeAvoidanceMatches({
  ingredients: [
    { name: "Ức gà", note: "Nguồn protein nạc" },
    { name: "Sữa tươi không đường", note: "" },
    { name: "Sốt mè rang", note: "Dùng lượng nhỏ" },
  ],
}, avoidanceTerms);

assert.deepEqual(matches, ["sữa", "mè"], "Allergens must be detected as complete ingredient terms.");
assert.deepEqual(
  findRecipeAvoidanceMatches({ ingredients: [{ name: "Cá hấp", note: "" }] }, ["cà"]),
  [],
  "Short terms must not match inside unrelated ingredient words.",
);

console.log("Personalized recipe safety test passed.");
