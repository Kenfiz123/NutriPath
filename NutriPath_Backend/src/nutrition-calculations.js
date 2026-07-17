/**
 * Nutrition Calculations Module
 * Chuẩn tính kcal, macro theo nghiên cứu khoa học quốc tế
 *
 * References:
 * - Mifflin-St Jeor (1990) - BMR formula recommended by ADA
 * - IOM 2005 - Dietary Reference Intakes
 * - ISSN 2017 - International Society of Sports Nutrition position stand
 * - WHO 2023 - Energy and protein requirements
 */

// ============================================================
// ACTIVITY LEVEL MULTIPLIERS
// Cải tiến từ IOM 2005 với bổ sung mức athlete
// ============================================================

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // < 5,000 bước/ngày, không tập
  light: 1.375,         // 1-3 ngày tập nhẹ, 5,000-7,500 bước
  moderate: 1.55,       // 3-5 ngày tập vừa, 7,500-10,000 bước
  active: 1.75,         // 5-6 ngày tập nặng, 10,000-12,500 bước
  very_active: 1.9,    // Vận động viên hoặc lao động nặng
  athlete: 2.2,         // VĐV chuyên nghiệp, tập 2 lần/ngày
};

// ============================================================
// PROTEIN MULTIPLIERS (g/kg body weight)
// Dựa trên ISSN 2017 và meta-analyses
// ============================================================

export const PROTEIN_MULTIPLIERS = {
  lose: {
    sedentary: 2.0,
    light: 2.1,
    moderate: 2.2,
    active: 2.3,
    very_active: 2.4,
    athlete: 2.5,
  },
  maintain: {
    sedentary: 1.4,
    light: 1.6,
    moderate: 1.8,
    active: 2.0,
    very_active: 2.2,
    athlete: 2.3,
  },
  gain: {
    sedentary: 1.6,
    light: 1.8,
    moderate: 2.0,
    active: 2.1,
    very_active: 2.2,
    athlete: 2.3,
  },
};

// ============================================================
// FAT PERCENTAGES
// Fat % của tổng calo theo mục tiêu
// ============================================================

export const FAT_PERCENTAGES = {
  lose: 0.28,    // 28% - hỗ trợ hormone và hấp thu vitamin
  maintain: 0.27, // 27%
  gain: 0.30,     // 30% - hỗ trợ testosterone
};

// ============================================================
// CARBS FLOORS (grams/day)
// Minimum carbs để đảm bảo chức năng não
// ============================================================

export const CARBS_FLOORS = {
  lose: 100,
  maintain: 130,
  gain: 150,
};

// ============================================================
// CALORIE BOUNDARIES
// ============================================================

export const CALORIE_BOUNDARIES = {
  male: { min: 1500, max: 4500 },
  female: { min: 1200, max: 4000 },
};

// ============================================================
// GOAL TYPES
// ============================================================

export const GOAL_TYPES = {
  LOSE_SLOW: "lose_slow",     // Giảm 0.25% BW/tuần
  LOSE: "lose",                 // Giảm 0.5% BW/tuần (mặc định)
  LOSE_FAST: "lose_fast",      // Giảm 1% BW/tuần (aggressive)
  MAINTAIN: "maintain",         // Duy trì
  GAIN_SLOW: "gain_slow",       // Tăng 0.25% BW/tuần (lean bulk)
  GAIN: "gain",                 // Tăng 0.5% BW/tuần
  GAIN_FAST: "gain_fast",       // Tăng 1% BW/tuần
  RECOMP: "recomp",             // Recomposition
};

// ============================================================
// LEGACY GOAL MAPPING (for backward compatibility)
// ============================================================

export const LEGACY_GOAL_MAP = {
  lose: GOAL_TYPES.LOSE,
  maintain: GOAL_TYPES.MAINTAIN,
  gain: GOAL_TYPES.GAIN,
};

// ============================================================
// CORE CALCULATION FUNCTIONS
// ============================================================

/**
 * Calculate BMR using Mifflin-St Jeor formula (1990)
 * Recommended by Academy of Nutrition and Dietetics
 * Accuracy: ±10% for healthy adults
 *
 * @param {number} weightKg - Body weight in kg
 * @param {number} heightCm - Height in cm
 * @param {number} age - Age in years
 * @param {"male"|"female"} gender
 * @returns {number} BMR in kcal/day
 */
export function calculateBMR(weightKg, heightCm, age, gender) {
  // Mifflin-St Jeor (1990)
  // Nam:  BMR = 10W + 6.25H - 5A + 5
  // Nữ:   BMR = 10W + 6.25H - 5A - 161

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? Math.round(base + 5) : Math.round(base - 161);
}

/**
 * Calculate BMR using Katch-McArdle formula
 * More accurate if body fat % is known
 *
 * @param {number} leanMassKg - Lean body mass in kg
 * @returns {number} BMR in kcal/day
 */
export function calculateBMR_KatchMcArdle(leanMassKg) {
  // Katch-McArdle: BMR = 370 + (21.6 × LBM)
  return Math.round(370 + 21.6 * leanMassKg);
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 *
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level key
 * @param {boolean} isAthlete - Whether user is athlete
 * @returns {number} TDEE in kcal/day
 */
export function calculateTDEE(bmr, activityLevel, isAthlete = false) {
  // Nếu là athlete, sử dụng multiplier cao hơn
  const athleteBoost = isAthlete ? 0.15 : 0;
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
  const adjustedMultiplier = Math.min(multiplier + athleteBoost, 2.4); // Cap at 2.4x

  return Math.round(bmr * adjustedMultiplier);
}

/**
 * Calculate calorie goal based on TDEE and objective
 *
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {string} goal - Goal type
 * @param {number} weightKg - Current body weight
 * @param {"male"|"female"} gender
 * @returns {{ calorieGoal: number, deficit: number, weeklyLossGrams: number }}
 */
export function calculateCalorieGoal(tdee, goal, weightKg, gender) {
  const boundaries = CALORIE_BOUNDARIES[gender];

  // Fat calories per kg: 7700 kcal (khoa học)
  const FAT_KCAL_PER_KG = 7700;

  // Weekly weight change rates (%)
  const WEEKLY_LOSS_RATES = {
    [GOAL_TYPES.LOSE_SLOW]: 0.0025,   // 0.25% = ~250g/week
    [GOAL_TYPES.LOSE]: 0.005,          // 0.5% = ~500g/week
    [GOAL_TYPES.LOSE_FAST]: 0.01,      // 1% = ~1kg/week
    [GOAL_TYPES.MAINTAIN]: 0,
    [GOAL_TYPES.GAIN_SLOW]: 0.0025,
    [GOAL_TYPES.GAIN]: 0.005,
    [GOAL_TYPES.GAIN_FAST]: 0.01,
    [GOAL_TYPES.RECOMP]: 0,
  };

  let calorieGoal = tdee;
  let deficit = 0;
  let weeklyLossGrams = 0;

  switch (goal) {
    case GOAL_TYPES.LOSE_SLOW:
    case GOAL_TYPES.LOSE:
    case GOAL_TYPES.LOSE_FAST: {
      const rate = WEEKLY_LOSS_RATES[goal];
      const weeklyDeficit = weightKg * rate * FAT_KCAL_PER_KG;

      deficit = Math.round(weeklyDeficit / 7);

      // Limit deficit to max 25% of TDEE
      const maxDeficit = Math.max(
        Math.round(tdee * 0.15),  // At least 15%
        Math.round(tdee * 0.25)   // Max 25%
      );
      deficit = Math.min(deficit, maxDeficit);

      // Cap at minimum calories
      calorieGoal = Math.max(boundaries.min, tdee - deficit);
      weeklyLossGrams = Math.round(((deficit * 7) / FAT_KCAL_PER_KG) * 1000);
      break;
    }

    case GOAL_TYPES.GAIN_SLOW:
    case GOAL_TYPES.GAIN:
    case GOAL_TYPES.GAIN_FAST: {
      const rate = WEEKLY_LOSS_RATES[goal];
      const weeklySurplus = weightKg * rate * FAT_KCAL_PER_KG;
      let surplus = Math.round(weeklySurplus / 7);

      // Limit surplus
      const maxSurplus = Math.min(600, Math.round(tdee * 0.20));
      surplus = Math.min(surplus, maxSurplus);

      calorieGoal = Math.min(boundaries.max, tdee + surplus);
      deficit = -surplus; // Negative = surplus
      weeklyLossGrams = -Math.round(((surplus * 7) / FAT_KCAL_PER_KG) * 1000);
      break;
    }

    case GOAL_TYPES.RECOMP:
      // Recomposition: eat at maintenance with high protein
      calorieGoal = tdee;
      deficit = 0;
      weeklyLossGrams = 0;
      break;

    case GOAL_TYPES.MAINTAIN:
    default:
      calorieGoal = tdee;
      deficit = 0;
      weeklyLossGrams = 0;
      break;
  }

  return { calorieGoal, deficit, weeklyLossGrams };
}

/**
 * Calculate protein target in grams
 *
 * @param {number} weightKg - Body weight in kg
 * @param {string} goal - Goal type
 * @param {string} activityLevel - Activity level
 * @returns {number} Protein in grams/day
 */
export function calculateProteinTarget(weightKg, goal, activityLevel) {
  // Map goal to lose/maintain/gain for lookup
  let goalCategory = "maintain";
  if ([GOAL_TYPES.LOSE_SLOW, GOAL_TYPES.LOSE, GOAL_TYPES.LOSE_FAST].includes(goal)) {
    goalCategory = "lose";
  } else if ([GOAL_TYPES.GAIN_SLOW, GOAL_TYPES.GAIN, GOAL_TYPES.GAIN_FAST, GOAL_TYPES.RECOMP].includes(goal)) {
    goalCategory = "gain";
  }

  const multipliers = PROTEIN_MULTIPLIERS[goalCategory];
  const multiplier = multipliers?.[activityLevel] ?? multipliers?.moderate ?? 1.8;

  return Math.round(weightKg * multiplier);
}

/**
 * Calculate minimum fat in grams (based on essential fat needs)
 *
 * @param {number} weightKg - Body weight in kg
 * @param {"male"|"female"} gender
 * @returns {number} Minimum fat in grams
 */
export function calculateMinimumFat(weightKg, gender) {
  // Essential fat needs: 0.5g/kg body weight minimum
  // Plus gender-specific adjustment
  const base = Math.round(weightKg * 0.5);
  const genderBonus = gender === "female" ? 10 : 0; // Women need slightly more for hormonal health
  return base + genderBonus;
}

/**
 * Calculate fat target based on calorie goal and goal type
 *
 * @param {number} calorieGoal - Daily calorie target
 * @param {string} goal - Goal type
 * @param {number} weightKg - Body weight
 * @param {"male"|"female"} gender
 * @returns {number} Fat in grams/day
 */
export function calculateFatTarget(calorieGoal, goal, weightKg, gender) {
  // Determine fat percentage based on goal
  let fatPct = 0.27; // default
  if ([GOAL_TYPES.LOSE_SLOW, GOAL_TYPES.LOSE, GOAL_TYPES.LOSE_FAST].includes(goal)) {
    fatPct = FAT_PERCENTAGES.lose;
  } else if ([GOAL_TYPES.GAIN_SLOW, GOAL_TYPES.GAIN, GOAL_TYPES.GAIN_FAST].includes(goal)) {
    fatPct = FAT_PERCENTAGES.gain;
  }

  let fatGrams = Math.round((calorieGoal * fatPct) / 9);

  // Ensure minimum fat
  const minFat = calculateMinimumFat(weightKg, gender);
  return Math.max(fatGrams, minFat);
}

/**
 * Calculate carbs target after protein and fat
 *
 * @param {number} calorieGoal - Daily calorie target
 * @param {number} proteinGrams - Protein in grams
 * @param {number} fatGrams - Fat in grams
 * @param {string} goal - Goal type
 * @returns {{ carbs: number, adjustedFat: number, carbsFloorApplied: boolean }}
 */
export function calculateCarbsTarget(calorieGoal, proteinGrams, fatGrams, goal) {
  // Carbs = (Total - Protein - Fat) / 4
  const proteinCals = proteinGrams * 4;
  const fatCals = fatGrams * 9;
  const remainingCals = calorieGoal - proteinCals - fatCals;

  let carbsGrams = Math.round(Math.max(0, remainingCals) / 4);
  let adjustedFat = fatGrams;
  let carbsFloorApplied = false;

  // Get floor based on goal
  let carbsFloor = CARBS_FLOORS.maintain;
  if ([GOAL_TYPES.LOSE_SLOW, GOAL_TYPES.LOSE, GOAL_TYPES.LOSE_FAST].includes(goal)) {
    carbsFloor = CARBS_FLOORS.lose;
  } else if ([GOAL_TYPES.GAIN_SLOW, GOAL_TYPES.GAIN, GOAL_TYPES.GAIN_FAST].includes(goal)) {
    carbsFloor = CARBS_FLOORS.gain;
  }

  // If carbs below floor, adjust fat
  if (carbsGrams < carbsFloor) {
    carbsFloorApplied = true;
    const carbDeficit = (carbsFloor - carbsGrams) * 4; // Calories needed
    const fatReduction = Math.round(carbDeficit / 9);
    adjustedFat = Math.max(fatGrams - fatReduction, Math.round(calorieGoal * 0.20 / 9)); // Min 20% fat
    carbsGrams = carbsFloor;
  }

  // Cap carbs at 65% of total calories
  const maxCarbs = Math.round(calorieGoal * 0.65 / 4);
  if (carbsGrams > maxCarbs) {
    carbsGrams = maxCarbs;
  }

  return { carbs: carbsGrams, adjustedFat, carbsFloorApplied };
}

/**
 * Calculate BMI and category
 *
 * @param {number} weightKg - Body weight in kg
 * @param {number} heightCm - Height in cm
 * @returns {{ value: number, label: string, category: string }}
 */
export function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const value = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  let label = "Bình thường";
  let category = "normal";

  if (value < 18.5) {
    label = "Thiếu cân";
    category = "underweight";
  } else if (value < 23) {
    label = "Bình thường";
    category = "normal";
  } else if (value < 25) {
    label = "Thừa cân";
    category = "overweight";
  } else if (value < 30) {
    label = "Béo phì độ 1";
    category = "obese1";
  } else {
    label = "Béo phì độ 2+";
    category = "obese2plus";
  }

  return { value, label, category };
}

/**
 * Calculate lean body mass estimate (simplified)
 *
 * @param {number} weightKg - Body weight in kg
 * @param {string} bodyShape - Body shape category
 * @param {"male"|"female"} gender
 * @returns {number} Estimated lean mass in kg
 */
export function estimateLeanMass(weightKg, bodyShape, gender) {
  // Body fat estimates by shape
  const bodyFatPct = {
    lean: { male: 10, female: 18 },
    average: { male: 18, female: 25 },
    muscular: { male: 15, female: 22 },
    curvy: { male: 22, female: 32 },
    large: { male: 28, female: 38 },
  };

  const bfPct = bodyFatPct[bodyShape]?.[gender] ?? bodyFatPct.average[gender];
  return Math.round(weightKg * (1 - bfPct / 100) * 10) / 10;
}

// ============================================================
// MAIN CALCULATION FUNCTION
// ============================================================

/**
 * Complete calorie and macro calculation
 *
 * @param {Object} db - Database with activityLevels and exerciseTypes
 * @param {Object} body - Input parameters
 * @param {number} body.age
 * @param {number} body.weightKg
 * @param {number} body.heightCm
 * @param {"male"|"female"} body.gender
 * @param {string} body.activityLevel
 * @param {string} body.goal
 * @param {string} [body.bodyShape]
 * @param {string} [body.exerciseType]
 * @param {number} [body.durationMinutes]
 * @param {number} [body.bodyFatPct]
 * @param {boolean} [body.isAthlete]
 * @returns {Object} Complete calculation results
 */
export function calculateCaloriesAdvanced(db, body) {
  const {
    age,
    weightKg,
    heightCm,
    gender,
    activityLevel,
    goal: rawGoal,
    bodyShape = "average",
    exerciseType = "walking",
    durationMinutes = 30,
    bodyFatPct,
    isAthlete = false,
  } = body;

  // Map legacy goals
  const goal = LEGACY_GOAL_MAP[rawGoal] ?? rawGoal ?? GOAL_TYPES.MAINTAIN;

  // Validate activity level
  const activity = db.activityLevels?.find((item) => item.id === activityLevel);
  const validActivityLevel = activity?.id ?? "moderate";

  // Calculate BMR
  const bmr = calculateBMR(weightKg, heightCm, age, gender);

  // If body fat is provided, offer more accurate BMR
  let bmrMethod = "Mifflin-St Jeor (1990)";
  let leanMass = null;
  let adjustedBmr = bmr;

  if (bodyFatPct && bodyFatPct > 0 && bodyFatPct <= 60) {
    leanMass = Math.round(weightKg * (1 - bodyFatPct / 100) * 10) / 10;
    const katchBmr = calculateBMR_KatchMcArdle(leanMass);
    // Average the two for best estimate
    adjustedBmr = Math.round((bmr + katchBmr) / 2);
    bmrMethod = "Mifflin-St Jeor + Katch-McArdle average";
  }

  // Calculate TDEE
  const tdee = calculateTDEE(adjustedBmr, validActivityLevel, isAthlete);

  // Calculate calorie goal
  const { calorieGoal, deficit, weeklyLossGrams } = calculateCalorieGoal(tdee, goal, weightKg, gender);

  // Calculate macros
  const proteinGrams = calculateProteinTarget(weightKg, goal, validActivityLevel);
  const fatGrams = calculateFatTarget(calorieGoal, goal, weightKg, gender);
  const { carbs, adjustedFat, carbsFloorApplied } = calculateCarbsTarget(calorieGoal, proteinGrams, fatGrams, goal);

  // Calculate BMI
  const bmi = calculateBMI(weightKg, heightCm);

  // Exercise calories burned
  const exercise = db.exerciseTypes?.find((item) => item.id === exerciseType) ?? db.exerciseTypes?.[0];
  const burnedCalories = exercise?.caloriesPerMinute
    ? Math.round(exercise.caloriesPerMinute * durationMinutes * (weightKg / 70))
    : 0;

  // Prepare results
  const results = {
    // Core metrics
    bmr: adjustedBmr,
    bmrMethod,
    tdee,
    tdeeMultiplier: tdee / adjustedBmr,
    calorieGoal,
    goalDelta: calorieGoal - tdee,
    weeklyLossGrams,

    // Formula info
    formula: "Mifflin-St Jeor (1990)",
    accuracy: {
      label: "Ước lượng tốt cho người trưởng thành khỏe mạnh",
      note: "Sai số thực tế: ±10% (BMR), ±15% (TDEE). Thay đổi theo cơ địa, % mỡ, giấc ngủ, stress và mức vận động thật.",
      sources: [
        "Academy of Nutrition and Dietetics",
        "International Society of Sports Nutrition (ISSN 2017)",
        "Institute of Medicine 2005",
      ],
    },

    // BMI
    bmi,
    leanMass,

    // Macros with detailed breakdown
    macros: [
      {
        name: "Protein",
        grams: proteinGrams,
        calories: proteinGrams * 4,
        pct: Math.round((proteinGrams * 4 / calorieGoal) * 100),
        note: "Cần thiết cho bảo vệ và xây dựng cơ",
      },
      {
        name: "Carbs",
        grams: carbs,
        calories: carbs * 4,
        pct: Math.round((carbs * 4 / calorieGoal) * 100),
        note: "Nguồn năng lượng chính cho não và cơ",
      },
      {
        name: "Chất béo",
        grams: adjustedFat,
        calories: adjustedFat * 9,
        pct: Math.round((adjustedFat * 9 / calorieGoal) * 100),
        note: "Hỗ trợ hormone và hấp thu vitamin",
      },
    ],

    // Raw macros for reference
    rawMacros: {
      protein: proteinGrams,
      carbs,
      fat: adjustedFat,
    },

    // Exercise info
    exercise: {
      label: exercise?.label ?? "Đi bộ",
      burnedCalories,
      fatEquivalentGrams: Math.round(burnedCalories / 9),
    },

    // Adjustment flags
    carbsFloorApplied,
    athleteModeApplied: isAthlete,

    // Goal info
    goalInfo: {
      type: goal,
      label: getGoalLabel(goal),
      description: getGoalDescription(goal, weeklyLossGrams),
    },
  };

  // Build warnings
  results.warnings = buildWarnings(results, body);

  return results;
}

/**
 * Get human-readable goal label
 */
function getGoalLabel(goal) {
  const labels = {
    [GOAL_TYPES.LOSE_SLOW]: "Giảm cân chậm",
    [GOAL_TYPES.LOSE]: "Giảm cân",
    [GOAL_TYPES.LOSE_FAST]: "Giảm cân nhanh",
    [GOAL_TYPES.MAINTAIN]: "Duy trì cân nặng",
    [GOAL_TYPES.GAIN_SLOW]: "Tăng cơ sạch",
    [GOAL_TYPES.GAIN]: "Tăng cân",
    [GOAL_TYPES.GAIN_FAST]: "Tăng cân nhanh",
    [GOAL_TYPES.RECOMP]: "Recomposition",
  };
  return labels[goal] ?? "Duy trì";
}

/**
 * Get goal description
 */
function getGoalDescription(goal, weeklyLossGrams) {
  const descriptions = {
    [GOAL_TYPES.LOSE_SLOW]: `Giảm ~${Math.abs(weeklyLossGrams)}g mỡ/tuần - An toàn và bền vững`,
    [GOAL_TYPES.LOSE]: `Giảm ~${Math.abs(weeklyLossGrams)}g mỡ/tuần - Cân bằng`,
    [GOAL_TYPES.LOSE_FAST]: `Giảm ~${Math.abs(weeklyLossGrams)}g mỡ/tuần - Aggressive, cần giám sát`,
    [GOAL_TYPES.MAINTAIN]: "Giữ nguyên cân nặng",
    [GOAL_TYPES.GAIN_SLOW]: `Tăng ~${Math.abs(weeklyLossGrams)}g/tuần - Lean bulk`,
    [GOAL_TYPES.GAIN]: `Tăng ~${Math.abs(weeklyLossGrams)}g/tuần`,
    [GOAL_TYPES.GAIN_FAST]: `Tăng ~${Math.abs(weeklyLossGrams)}g/tuần - Bulk nhanh`,
    [GOAL_TYPES.RECOMP]: "Thay đổi body composition (giảm mỡ, tăng cơ)",
  };
  return descriptions[goal] ?? "Duy trì cân nặng ổn định";
}

/**
 * Build calculation warnings
 */
function buildWarnings(results, input) {
  const warnings = [];

  // Standard disclaimer
  warnings.push("BMR/TDEE là ước lượng theo công thức Mifflin-St Jeor, không thay thế đo chuyển hóa trực tiếp (indirect calorimetry).");

  // Medical disclaimer
  warnings.push("Nếu có bệnh nền, mang thai, tiểu đường, rối loạn ăn uống hoặc mục tiêu giảm cân mạnh, hãy hỏi bác sĩ/chuyên gia dinh dưỡng.");

  // Calorie floor warning
  if (results.goalDelta < 0 && results.calorieGoal < results.tdee * 0.75) {
    warnings.unshift("Mức giảm calo đã được giới hạn để không thấp hơn ngưỡng an toàn cho sức khỏe.");
  }

  // Carbs floor applied
  if (results.carbsFloorApplied) {
    warnings.unshift("Macro đã được cân chỉnh để carbs không xuống dưới mức tối thiểu (đảm bảo chức năng não).");
  }

  // Athlete mode
  if (results.athleteModeApplied) {
    warnings.unshift("Chế độ Athlete đang bật - TDEE được điều chỉnh cao hơn cho vận động viên.");
  }

  // Fast loss warning
  if ([GOAL_TYPES.LOSE_FAST].includes(results.goalInfo.type) && results.calorieGoal < results.tdee * 0.80) {
    warnings.unshift("Chế độ giảm cân nhanh chỉ phù hợp khi BMI > 30 và cần giám sát y tế.");
  }

  return warnings;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Validate goal type
 */
export function isValidGoal(goal) {
  return Object.values(GOAL_TYPES).includes(goal) || ["lose", "maintain", "gain"].includes(goal);
}

/**
 * Get safe calorie minimum
 */
export function getSafeCalorieMinimum(gender) {
  return CALORIE_BOUNDARIES[gender]?.min ?? 1200;
}

/**
 * Get safe calorie maximum
 */
export function getSafeCalorieMaximum(gender) {
  return CALORIE_BOUNDARIES[gender]?.max ?? 4000;
}

/**
 * Calculate goal delta (for backward compatibility)
 */
export function getGoalDelta(goal, tdee, safeMinimum) {
  const gender = safeMinimum >= 1500 ? "male" : "female";
  const result = calculateCalorieGoal(tdee, goal, 70, gender);
  return result.calorieGoal - tdee;
}

/**
 * Get protein per kg (for backward compatibility)
 */
export function getProteinPerKg(goal, activityId) {
  const mappedGoal = LEGACY_GOAL_MAP[goal] ?? goal ?? GOAL_TYPES.MAINTAIN;
  let goalCategory = "maintain";
  if ([GOAL_TYPES.LOSE_SLOW, GOAL_TYPES.LOSE, GOAL_TYPES.LOSE_FAST].includes(mappedGoal)) {
    goalCategory = "lose";
  } else if ([GOAL_TYPES.GAIN_SLOW, GOAL_TYPES.GAIN, GOAL_TYPES.GAIN_FAST].includes(mappedGoal)) {
    goalCategory = "gain";
  }
  return PROTEIN_MULTIPLIERS[goalCategory]?.[activityId] ?? 1.8;
}

/**
 * Get fat percentage (for backward compatibility)
 */
export function getFatPct(goal) {
  const mappedGoal = LEGACY_GOAL_MAP[goal] ?? goal ?? GOAL_TYPES.MAINTAIN;
  if ([GOAL_TYPES.LOSE_SLOW, GOAL_TYPES.LOSE, GOAL_TYPES.LOSE_FAST].includes(mappedGoal)) {
    return FAT_PERCENTAGES.lose;
  }
  if ([GOAL_TYPES.GAIN_SLOW, GOAL_TYPES.GAIN, GOAL_TYPES.GAIN_FAST].includes(mappedGoal)) {
    return FAT_PERCENTAGES.gain;
  }
  return FAT_PERCENTAGES.maintain;
}
