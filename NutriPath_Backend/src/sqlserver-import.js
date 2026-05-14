import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function sqlArgs(database, query, options = {}) {
  const server = process.env.NUTRIPATH_SQL_SERVER || "localhost";
  const args = ["-S", server, "-d", database, "-y", "0", "-Y", "0", "-Q", `SET NOCOUNT ON; ${query}`];

  if (process.env.NUTRIPATH_SQL_USER && process.env.NUTRIPATH_SQL_PASSWORD) {
    args.splice(2, 0, "-U", process.env.NUTRIPATH_SQL_USER, "-P", process.env.NUTRIPATH_SQL_PASSWORD);
  } else {
    args.splice(2, 0, "-E");
  }

  if (process.env.NUTRIPATH_SQL_TRUST_CERT === "true") {
    args.splice(args.length - 2, 0, "-N", "-C");
  }

  if (options.unicodeOutput) {
    args.splice(args.length - 2, 0, "-u");
  }

  return args;
}

async function queryJson(database, query) {
  const wrappedQuery = `
DECLARE @json NVARCHAR(MAX);
SET @json = (${query.replace(/;\s*$/, "")});
SELECT CONVERT(VARCHAR(MAX), CONVERT(VARBINARY(MAX), COALESCE(@json, N'[]')), 2);
`;
  const { stdout } = await execFileAsync("sqlcmd", sqlArgs(database, wrappedQuery), {
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  const hex = stdout.replace(/\s+/g, "").trim();
  if (!hex) return [];
  const json = Buffer.from(hex, "hex").toString("utf16le");
  if (!json) return [];
  if (json.toUpperCase() === "NULL") return [];
  return JSON.parse(json);
}

async function execSql(database, command) {
  await execFileAsync("sqlcmd", sqlArgs(database, command), {
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
}

export function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  return `N'${String(value).replace(/'/g, "''")}'`;
}

export async function ensureSqlServerAuthSchema() {
  const database = process.env.NUTRIPATH_SQL_DATABASE || "NutriPath";
  await execSql(database, `
IF OBJECT_ID(N'dbo.AuthCredentials', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AuthCredentials (
    id NVARCHAR(60) NOT NULL PRIMARY KEY,
    member_id NVARCHAR(40) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    password_salt NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_AuthCredentials_Members FOREIGN KEY (member_id) REFERENCES dbo.Members(id)
  );
END;
`);
}

export async function insertSqlServerAuthMember(member, credential) {
  const database = process.env.NUTRIPATH_SQL_DATABASE || "NutriPath";
  await ensureSqlServerAuthSchema();
  await execSql(database, `
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM dbo.Members WHERE id = ${sqlLiteral(member.id)})
BEGIN
  INSERT INTO dbo.Members (
    id, name, email, initials, role, status, tier, gender, age, weight_kg, height_cm,
    activity_level_id, goal, joined_at, calorie_target, protein_target, carbs_target,
    fat_target, water_target_glasses, member_days, saved_recipes, ai_conversations,
    tracked_calories, streak_days
  )
  VALUES (
    ${sqlLiteral(member.id)}, ${sqlLiteral(member.name)}, ${sqlLiteral(member.email)}, ${sqlLiteral(member.initials)},
    ${sqlLiteral(member.role)}, ${sqlLiteral(member.status)}, ${sqlLiteral(member.tier)}, ${sqlLiteral(member.gender)},
    ${sqlLiteral(member.age)}, ${sqlLiteral(member.weightKg)}, ${sqlLiteral(member.heightCm)}, ${sqlLiteral(member.activityLevel)},
    ${sqlLiteral(member.goal)}, ${sqlLiteral(member.joinedAt)}, ${sqlLiteral(member.calorieTarget)},
    ${sqlLiteral(member.macroTargets.protein)}, ${sqlLiteral(member.macroTargets.carbs)}, ${sqlLiteral(member.macroTargets.fat)},
    ${sqlLiteral(member.waterTargetGlasses)}, 0, 0, 0, 0, 0
  );

  INSERT INTO dbo.Subscriptions (member_id, plan_id, billing, status, started_at, renews_at, days_total, days_remaining)
  VALUES (${sqlLiteral(member.id)}, ${sqlLiteral(member.tier)}, N'monthly', N'active', ${sqlLiteral(member.joinedAt)}, NULL, NULL, NULL);
END;

INSERT INTO dbo.AuthCredentials (id, member_id, email, password_hash, password_salt)
VALUES (${sqlLiteral(credential.id)}, ${sqlLiteral(credential.memberId)}, ${sqlLiteral(credential.email)}, ${sqlLiteral(credential.passwordHash)}, ${sqlLiteral(credential.passwordSalt)});

COMMIT TRANSACTION;
`);
}

export async function insertSqlServerCredential(credential) {
  const database = process.env.NUTRIPATH_SQL_DATABASE || "NutriPath";
  await ensureSqlServerAuthSchema();
  await execSql(database, `
INSERT INTO dbo.AuthCredentials (id, member_id, email, password_hash, password_salt)
VALUES (${sqlLiteral(credential.id)}, ${sqlLiteral(credential.memberId)}, ${sqlLiteral(credential.email)}, ${sqlLiteral(credential.passwordHash)}, ${sqlLiteral(credential.passwordSalt)});
`);
}

function byId(items) {
  return new Map(items.map((item) => [item.id, item]));
}

export async function loadSqlServerData() {
  const database = process.env.NUTRIPATH_SQL_DATABASE || "NutriPath";
  await ensureSqlServerAuthSchema();

  const [
    activityLevels,
    exerciseTypes,
    plans,
    planFeatures,
    membersRaw,
    subscriptions,
    foods,
    mealLogsRaw,
    mealSections,
    mealItems,
    goals,
    weeklyProgress,
    recipesRaw,
    recipeTags,
    recipeIngredients,
    recipeSteps,
    paymentsRaw,
    faqsRaw,
    quickRepliesRaw,
    cannedResponsesRaw,
    adminUsers,
    adminKpis,
    systemServices,
    aiSettingsRows,
    securityRows,
    loginActivity,
    authCredentialsRaw,
  ] = await Promise.all([
    queryJson(database, "SELECT id, label, description, multiplier FROM dbo.ActivityLevels FOR JSON PATH;"),
    queryJson(database, "SELECT id, label, calories_per_minute AS caloriesPerMinute FROM dbo.ExerciseTypes FOR JSON PATH;"),
    queryJson(database, "SELECT id, name, monthly_price AS monthlyPrice, period, description FROM dbo.Plans FOR JSON PATH;"),
    queryJson(database, "SELECT plan_id AS planId, label, CAST(included AS bit) AS included FROM dbo.PlanFeatures FOR JSON PATH;"),
    queryJson(database, `SELECT id, name, email, initials, role, status, tier, gender, age,
      weight_kg AS weightKg, height_cm AS heightCm, activity_level_id AS activityLevel, goal,
      CONVERT(varchar(10), joined_at, 23) AS joinedAt, calorie_target AS calorieTarget,
      protein_target AS proteinTarget, carbs_target AS carbsTarget, fat_target AS fatTarget,
      water_target_glasses AS waterTargetGlasses, member_days AS memberDays, saved_recipes AS savedRecipes,
      ai_conversations AS aiConversations, tracked_calories AS trackedCalories, streak_days AS streakDays
      FROM dbo.Members FOR JSON PATH;`),
    queryJson(database, `SELECT member_id AS memberId, plan_id AS planId, billing, status,
      CONVERT(varchar(10), started_at, 23) AS startedAt, CONVERT(varchar(10), renews_at, 23) AS renewsAt,
      days_total AS daysTotal, days_remaining AS daysRemaining FROM dbo.Subscriptions FOR JSON PATH;`),
    queryJson(database, "SELECT id, name, category, calories, protein, carbs, fat, portion FROM dbo.Foods FOR JSON PATH;"),
    queryJson(database, `SELECT id, member_id AS memberId, CONVERT(varchar(10), log_date, 23) AS date,
      water_glasses AS waterGlasses, steps, burned_calories AS burnedCalories, active_minutes AS activeMinutes
      FROM dbo.MealLogs FOR JSON PATH;`),
    queryJson(database, `SELECT id, meal_log_id AS mealLogId, name, icon, target_kcal AS targetKcal,
      CONVERT(varchar(5), meal_time, 108) AS time FROM dbo.MealSections FOR JSON PATH;`),
    queryJson(database, `SELECT id, meal_log_id AS mealLogId, meal_section_id AS mealSectionId,
      food_id AS foodId, name, calories, protein, carbs, fat, portion, quantity
      FROM dbo.MealItems FOR JSON PATH;`),
    queryJson(database, "SELECT id, meal_log_id AS mealLogId, label, CAST(done AS bit) AS done FROM dbo.Goals FOR JSON PATH;"),
    queryJson(database, `SELECT member_id AS memberId, CONVERT(varchar(10), progress_date, 23) AS date,
      day_label AS day, consumed, target FROM dbo.WeeklyProgress FOR JSON PATH;`),
    queryJson(database, `SELECT id, name, image_url AS image, time_minutes AS timeMinutes, calories,
      difficulty, servings, protein, carbs, fat, fiber FROM dbo.Recipes FOR JSON PATH;`),
    queryJson(database, "SELECT recipe_id AS recipeId, tag FROM dbo.RecipeTags FOR JSON PATH;"),
    queryJson(database, "SELECT recipe_id AS recipeId, name, amount, sort_order AS sortOrder FROM dbo.RecipeIngredients FOR JSON PATH;"),
    queryJson(database, "SELECT recipe_id AS recipeId, step_order AS stepOrder, instruction FROM dbo.RecipeSteps FOR JSON PATH;"),
    queryJson(database, `SELECT id, member_id AS memberId, invoice, plan_id AS planId, billing,
      payment_method AS paymentMethod, amount, currency, status, CONVERT(varchar(33), paid_at, 126) AS paidAt
      FROM dbo.Payments ORDER BY paid_at DESC FOR JSON PATH;`),
    queryJson(database, "SELECT id, question, answer FROM dbo.Faqs FOR JSON PATH;"),
    queryJson(database, "SELECT text FROM dbo.ChatQuickReplies ORDER BY id FOR JSON PATH;"),
    queryJson(database, "SELECT prompt, response FROM dbo.ChatCannedResponses FOR JSON PATH;"),
    queryJson(database, "SELECT id, name, email, role, status, CONVERT(varchar(10), joined_at, 23) AS joined, plan_name AS [plan] FROM dbo.AdminUsers FOR JSON PATH;"),
    queryJson(database, "SELECT id, label, value, change_text AS change FROM dbo.AdminKpis FOR JSON PATH;"),
    queryJson(database, "SELECT id, name, status, uptime, latency_ms AS latencyMs FROM dbo.AdminSystemServices FOR JSON PATH;"),
    queryJson(database, `SELECT model, CAST(auto_portion_recommendation AS bit) AS autoPortionRecommendation,
      CAST(smart_meal_suggestions AS bit) AS smartMealSuggestions, CAST(nutrition_validation AS bit) AS nutritionValidation,
      confidence_threshold AS confidenceThreshold, calorie_formula AS calorieFormula FROM dbo.AdminAiSettings WHERE id = 1 FOR JSON PATH;`),
    queryJson(database, `SELECT CAST(two_factor_enabled AS bit) AS twoFactorEnabled, min_password_length AS minPasswordLength,
      CAST(require_special_char AS bit) AS requireSpecialChar, CAST(require_uppercase AS bit) AS requireUppercase,
      CAST(require_number AS bit) AS requireNumber FROM dbo.AdminSecuritySettings WHERE id = 1 FOR JSON PATH;`),
    queryJson(database, "SELECT ip, device, location, CONVERT(varchar(33), login_time, 126) AS time, status FROM dbo.LoginActivity FOR JSON PATH;"),
    queryJson(database, "SELECT id, member_id AS memberId, email, password_hash AS passwordHash, password_salt AS passwordSalt, CONVERT(varchar(33), created_at, 126) AS createdAt FROM dbo.AuthCredentials FOR JSON PATH;"),
  ]);

  const planMap = byId(plans);
  for (const feature of planFeatures) {
    const plan = planMap.get(feature.planId);
    if (plan) {
      plan.features ??= [];
      plan.features.push({ label: feature.label, included: Boolean(feature.included) });
    }
  }

  const members = membersRaw.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    initials: member.initials,
    role: member.role,
    status: member.status,
    tier: member.tier,
    gender: member.gender,
    age: member.age,
    weightKg: Number(member.weightKg),
    heightCm: Number(member.heightCm),
    activityLevel: member.activityLevel,
    goal: member.goal,
    joinedAt: member.joinedAt,
    calorieTarget: member.calorieTarget,
    macroTargets: {
      protein: Number(member.proteinTarget),
      carbs: Number(member.carbsTarget),
      fat: Number(member.fatTarget),
    },
    waterTargetGlasses: member.waterTargetGlasses,
    subscription: subscriptions.find((subscription) => subscription.memberId === member.id) ?? null,
    stats: {
      memberDays: member.memberDays,
      savedRecipes: member.savedRecipes,
      aiConversations: member.aiConversations,
      trackedCalories: member.trackedCalories,
      streakDays: member.streakDays,
    },
  }));

  const mealLogs = mealLogsRaw.map((log) => ({
    id: log.id,
    memberId: log.memberId,
    date: log.date,
    waterGlasses: log.waterGlasses,
    activity: {
      steps: log.steps,
      burnedCalories: log.burnedCalories,
      activeMinutes: log.activeMinutes,
    },
    goals: goals
      .filter((goal) => goal.mealLogId === log.id)
      .map((goal) => ({ id: goal.id, label: goal.label, done: Boolean(goal.done) })),
    meals: mealSections
      .filter((section) => section.mealLogId === log.id)
      .map((section) => ({
        id: section.id,
        name: section.name,
        icon: section.icon,
        targetKcal: section.targetKcal,
        time: section.time,
        items: mealItems
          .filter((item) => item.mealLogId === log.id && item.mealSectionId === section.id)
          .map((item) => ({
            id: item.id,
            foodId: item.foodId,
            name: item.name,
            calories: Number(item.calories),
            protein: Number(item.protein),
            carbs: Number(item.carbs),
            fat: Number(item.fat),
            portion: item.portion,
            quantity: Number(item.quantity),
          })),
      })),
  }));

  const recipes = recipesRaw.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    image: recipe.image,
    timeMinutes: recipe.timeMinutes,
    calories: recipe.calories,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    tags: recipeTags.filter((item) => item.recipeId === recipe.id).map((item) => item.tag),
    ingredients: recipeIngredients
      .filter((item) => item.recipeId === recipe.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ name: item.name, amount: item.amount })),
    steps: recipeSteps
      .filter((item) => item.recipeId === recipe.id)
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((item) => item.instruction),
    nutrition: {
      protein: Number(recipe.protein),
      carbs: Number(recipe.carbs),
      fat: Number(recipe.fat),
      fiber: Number(recipe.fiber),
    },
  }));

  const cannedResponses = {};
  for (const item of cannedResponsesRaw) cannedResponses[item.prompt] = item.response;

  return {
    meta: {
      name: "NutriPath API",
      version: "1.0.0",
      source: "sqlserver",
      loadedAt: new Date().toISOString(),
    },
    activityLevels,
    exerciseTypes,
    members,
    foods,
    mealLogs,
    weeklyProgress,
    recipes,
    plans,
    faqs: faqsRaw,
    payments: paymentsRaw,
    authCredentials: authCredentialsRaw,
    chat: {
      quickReplies: quickRepliesRaw.map((item) => item.text),
      cannedResponses,
    },
    admin: {
      users: adminUsers,
      kpis: adminKpis,
      systemServices,
      aiSettings: aiSettingsRows[0] ?? {},
      security: {
        twoFactorEnabled: Boolean(securityRows[0]?.twoFactorEnabled),
        passwordPolicy: {
          minLength: securityRows[0]?.minPasswordLength ?? 8,
          requireSpecialChar: Boolean(securityRows[0]?.requireSpecialChar),
          requireUppercase: Boolean(securityRows[0]?.requireUppercase),
          requireNumber: Boolean(securityRows[0]?.requireNumber),
        },
        loginActivity,
      },
    },
  };
}
