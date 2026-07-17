/**
 * Test script để verify logic kcal mới
 */

import assert from "node:assert/strict";
import {
  calculateBMR,
  calculateBMR_KatchMcArdle,
  calculateTDEE,
  calculateCalorieGoal,
  calculateCaloriesAdvanced,
  calculateProteinTarget,
  calculateFatTarget,
  calculateCarbsTarget,
  calculateBMI,
  ACTIVITY_MULTIPLIERS,
  GOAL_TYPES,
  PROTEIN_MULTIPLIERS,
} from "../src/nutrition-calculations.js";

console.log("=== Testing Nutrition Calculations Module ===\n");

// Test BMR với Mifflin-St Jeor
console.log("1. Testing BMR (Mifflin-St Jeor)...");
const bmrFemale = calculateBMR(65, 168, 25, "female");
const bmrMale = calculateBMR(80, 175, 30, "male");
console.log(`   Female (65kg, 168cm, 25y): ${bmrFemale} kcal`);
console.log(`   Male (80kg, 175cm, 30y): ${bmrMale} kcal`);
assert.ok(bmrFemale > 1200 && bmrFemale < 1600, "BMR female should be reasonable");
assert.ok(bmrMale > 1600 && bmrMale < 2000, "BMR male should be reasonable");
assert.equal(bmrFemale, 1414);
assert.equal(bmrMale, 1749);
assert.equal(calculateBMR_KatchMcArdle(50), 1450, "Katch-McArdle should use lean mass without a gender offset");
console.log("   ✓ BMR calculations are correct\n");

// Test TDEE
console.log("2. Testing TDEE with activity multipliers...");
for (const [level, mult] of Object.entries(ACTIVITY_MULTIPLIERS)) {
  const tdee = calculateTDEE(bmrFemale, level);
  console.log(`   ${level}: ${tdee} kcal (${mult}x)`);
  assert.ok(tdee === Math.round(bmrFemale * mult), `TDEE should be BMR × ${mult}`);
}
console.log("   ✓ TDEE calculations are correct\n");

// Test Calorie Goal cho các mục tiêu
console.log("3. Testing Calorie Goals...");
const tdee = calculateTDEE(bmrFemale, "moderate");
console.log(`   TDEE baseline: ${tdee} kcal`);

const goals = [
  { type: GOAL_TYPES.LOSE, desc: "Giảm cân chuẩn" },
  { type: GOAL_TYPES.LOSE_SLOW, desc: "Giảm cân chậm" },
  { type: GOAL_TYPES.LOSE_FAST, desc: "Giảm cân nhanh" },
  { type: GOAL_TYPES.MAINTAIN, desc: "Duy trì" },
  { type: GOAL_TYPES.GAIN_SLOW, desc: "Tăng cơ sạch" },
  { type: GOAL_TYPES.GAIN, desc: "Tăng cân" },
];

for (const { type, desc } of goals) {
  const result = calculateCalorieGoal(tdee, type, 65, "female");
  const deficit = type === GOAL_TYPES.MAINTAIN ? 0 :
    (type.includes("gain") ? -result.deficit : result.deficit);
  console.log(`   ${desc}: ${result.calorieGoal} kcal (delta: ${deficit > 0 ? "-" : "+"}${Math.abs(deficit)})`);
  assert.ok(result.calorieGoal >= 1200, "Calorie goal should not be below minimum");
  assert.ok(result.weeklyLossGrams !== undefined, "Should have weekly loss estimate");
}
const standardLoss = calculateCalorieGoal(tdee, GOAL_TYPES.LOSE, 65, "female");
const standardGain = calculateCalorieGoal(tdee, GOAL_TYPES.GAIN, 65, "female");
assert.equal(standardLoss.weeklyLossGrams, 325, "0.5% weekly loss for 65kg should be about 325g");
assert.equal(standardGain.weeklyLossGrams, -325, "0.5% weekly gain for 65kg should be about 325g");
console.log("   ✓ Calorie goals are correct\n");

// Test Protein targets
console.log("4. Testing Protein Targets...");
for (const goal of ["lose", "maintain", "gain"]) {
  for (const activity of ["sedentary", "moderate", "active"]) {
    const protein = calculateProteinTarget(65, goal, activity);
    const expected = PROTEIN_MULTIPLIERS[goal]?.[activity] * 65;
    console.log(`   ${goal}/${activity}: ${protein}g (${(expected/65).toFixed(1)}g/kg)`);
    assert.equal(protein, Math.round(expected), "Protein should match expected");
  }
}
console.log("   ✓ Protein calculations are correct\n");

// Test Macro calculations
console.log("5. Testing Macro Split...");
const calorieGoal = 1500;
const protein = calculateProteinTarget(65, "lose", "moderate");
const fat = calculateFatTarget(calorieGoal, "lose", 65, "female");
const { carbs, adjustedFat, carbsFloorApplied } = calculateCarbsTarget(calorieGoal, protein, fat, "lose");

console.log(`   Calorie Goal: ${calorieGoal} kcal`);
console.log(`   Protein: ${protein}g = ${protein * 4} kcal (${Math.round((protein * 4 / calorieGoal) * 100)}%)`);
console.log(`   Fat: ${adjustedFat}g = ${adjustedFat * 9} kcal (${Math.round((adjustedFat * 9 / calorieGoal) * 100)}%)`);
console.log(`   Carbs: ${carbs}g = ${carbs * 4} kcal (${Math.round((carbs * 4 / calorieGoal) * 100)}%)`);
console.log(`   Carbs floor applied: ${carbsFloorApplied}`);

// Verify total (allow small rounding difference)
const totalCals = protein * 4 + adjustedFat * 9 + carbs * 4;
const diff = Math.abs(totalCals - calorieGoal);
assert.ok(diff <= 5, `Total calories should be within 5 of goal: ${totalCals} vs ${calorieGoal}, diff=${diff}`);
console.log(`   Total: ${totalCals} kcal ✓`);
console.log("   ✓ Macro split is balanced\n");

// Test BMI
console.log("6. Testing BMI...");
const bmi1 = calculateBMI(65, 168);
const bmi2 = calculateBMI(90, 170);
const bmi3 = calculateBMI(50, 165);
console.log(`   65kg/168cm: BMI=${bmi1.value} (${bmi1.label})`);
console.log(`   90kg/170cm: BMI=${bmi2.value} (${bmi2.label})`);
console.log(`   50kg/165cm: BMI=${bmi3.value} (${bmi3.label})`);
// BMI thresholds: underweight < 18.5, normal < 23, overweight < 25, obese1 < 30, obese2plus >= 30
assert.equal(bmi1.label, "Thừa cân", "BMI 23+ should be Thừa cân");
assert.equal(bmi2.label, "Béo phì độ 2+", "BMI 30+ should be Béo phì độ 2+");
assert.equal(bmi3.label, "Thiếu cân", "BMI < 18.5 should be Thiếu cân");
console.log("   ✓ BMI categories are correct\n");

// Test với dữ liệu sample từ seed
console.log("7. Testing with sample data (Minh An: female, 25y, 65kg, 168cm)...");
const bmr = calculateBMR(65, 168, 25, "female");
const tdeeLight = calculateTDEE(bmr, "light");
const loseResult = calculateCalorieGoal(tdeeLight, GOAL_TYPES.LOSE, 65, "female");
const proteinForLose = calculateProteinTarget(65, GOAL_TYPES.LOSE, "light");
const fatForLose = calculateFatTarget(loseResult.calorieGoal, GOAL_TYPES.LOSE, 65, "female");
const { carbs: carbsForLose } = calculateCarbsTarget(loseResult.calorieGoal, proteinForLose, fatForLose, GOAL_TYPES.LOSE);

console.log(`   BMR: ${bmr} kcal`);
console.log(`   TDEE (light): ${tdeeLight} kcal`);
console.log(`   Calorie Goal (lose): ${loseResult.calorieGoal} kcal (deficit: -${loseResult.deficit})`);
console.log(`   Weekly loss: ~${loseResult.weeklyLossGrams}g`);
console.log(`   Protein: ${proteinForLose}g (${(proteinForLose * 4 / loseResult.calorieGoal * 100).toFixed(0)}%)`);
console.log(`   Fat: ${fatForLose}g (${(fatForLose * 9 / loseResult.calorieGoal * 100).toFixed(0)}%)`);
console.log(`   Carbs: ${carbsForLose}g (${(carbsForLose * 4 / loseResult.calorieGoal * 100).toFixed(0)}%)`);
assert.equal(loseResult.weeklyLossGrams, 325);
assert.equal(loseResult.calorieGoal - tdeeLight, -loseResult.deficit);
console.log("   ✓ Sample calculation complete\n");

const advancedResult = calculateCaloriesAdvanced({
  activityLevels: [{ id: "light", multiplier: 1.375 }],
  exerciseTypes: [{ id: "walking", label: "Đi bộ", caloriesPerMinute: 5 }],
}, {
  age: 25,
  weightKg: 65,
  heightCm: 168,
  gender: "female",
  activityLevel: "light",
  goal: "lose",
  exerciseType: "walking",
  durationMinutes: 30,
  bodyFatPct: 20,
});
assert.equal(advancedResult.leanMass, 52, "Lean mass should use the supplied body-fat percentage");
assert.equal(advancedResult.goalDelta, advancedResult.calorieGoal - advancedResult.tdee);

console.log("=== All Tests Passed! ===");
