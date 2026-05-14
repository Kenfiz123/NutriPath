import http from "node:http";
import crypto from "node:crypto";
import { createStore, cloneRecord } from "./store.js";
import { apiLinks, collectionResponse, currentLink, errorResponse, link } from "./hateoas.js";
import { insertSqlServerAuthMember, insertSqlServerCredential } from "./sqlserver-import.js";

const routes = [];
const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const PASSWORD_ITERATIONS = 120000;

function route(method, pattern, handler) {
  routes.push({ method, pattern, handler });
}

function normalizePath(pathname) {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

function splitPath(value) {
  return normalizePath(value).split("/").filter(Boolean);
}

function matchRoute(pattern, pathname) {
  const expected = splitPath(pattern);
  const actual = splitPath(pathname);
  if (expected.length !== actual.length) return null;

  const params = {};
  for (let i = 0; i < expected.length; i += 1) {
    const token = expected[i];
    const part = actual[i];
    if (token.startsWith(":")) {
      params[token.slice(1)] = decodeURIComponent(part);
      continue;
    }
    if (token !== part) return null;
  }
  return params;
}

function sendJson(req, res, status, payload) {
  const origin = process.env.CORS_ORIGIN || "*";
  res.writeHead(status, {
    "Content-Type": "application/hal+json; charset=utf-8",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    error.code = "invalid_json";
    throw error;
  }
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isTruthyQuery(value) {
  return value === "true" || value === "1" || value === "yes";
}

function notFound(req, message = "Resource not found.") {
  const error = new Error(message);
  error.status = 404;
  error.code = "not_found";
  throw error;
}

function badRequest(message, details) {
  const error = new Error(message);
  error.status = 400;
  error.code = "bad_request";
  error.details = details;
  throw error;
}

function unauthorized(message = "Authentication required.") {
  const error = new Error(message);
  error.status = 401;
  error.code = "unauthorized";
  throw error;
}

function conflict(message, details) {
  const error = new Error(message);
  error.status = 409;
  error.code = "conflict";
  error.details = details;
  throw error;
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) badRequest("Missing required fields.", { missing });
}

function initialsFromName(name) {
  return String(name || "User")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function ensureAuthCredentials(db) {
  db.authCredentials ??= [];
  return db.authCredentials;
}

function findCredentialByEmail(db, email) {
  const normalized = normalizeEmail(email);
  return ensureAuthCredentials(db).find((credential) => normalizeEmail(credential.email) === normalized);
}

function findMemberByEmail(db, email) {
  const normalized = normalizeEmail(email);
  return db.members.find((member) => normalizeEmail(member.email) === normalized);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto.pbkdf2Sync(String(password), salt, PASSWORD_ITERATIONS, 32, "sha256").toString("hex");
  return { passwordHash, passwordSalt: salt };
}

function verifyPassword(password, credential) {
  if (!credential?.passwordHash || !credential?.passwordSalt) return false;
  const { passwordHash } = hashPassword(password, credential.passwordSalt);
  const expected = Buffer.from(String(credential.passwordHash), "hex");
  const actual = Buffer.from(passwordHash, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function authSessionResponse(req, member) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { memberId: member.id, expiresAt });

  return {
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    member: memberResource(req, member),
    _links: {
      self: currentLink(req),
      me: link(req, "/api/auth/me"),
      logout: link(req, "/api/auth/logout", "POST"),
      dashboard: link(req, `/api/members/${member.id}/dashboard`),
      profile: link(req, `/api/members/${member.id}/profile`),
    },
  };
}

function requireSession(req, store) {
  const token = getBearerToken(req);
  const session = token ? sessions.get(token) : null;
  if (!token || !session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    unauthorized("Bạn cần đăng nhập để tiếp tục.");
  }

  const member = getMember(store.db, session.memberId);
  if (!member) {
    sessions.delete(token);
    unauthorized("Phiên đăng nhập không còn hợp lệ.");
  }

  return { token, member };
}

function memberFromRegistration(store, body, id = store.nextId("mem", store.db.members)) {
  const name = String(body.name || "").trim();
  const tier = body.tier || "free";
  const joinedAt = new Date().toISOString().slice(0, 10);

  return {
    id,
    name,
    email: normalizeEmail(body.email),
    initials: body.initials || initialsFromName(name),
    role: "member",
    status: "active",
    tier,
    gender: body.gender || "female",
    age: Number(body.age || 25),
    weightKg: Number(body.weightKg || 65),
    heightCm: Number(body.heightCm || 168),
    activityLevel: body.activityLevel || "light",
    goal: body.goal || "maintain",
    joinedAt,
    calorieTarget: Number(body.calorieTarget || 1800),
    macroTargets: body.macroTargets || { protein: 120, carbs: 220, fat: 60 },
    waterTargetGlasses: Number(body.waterTargetGlasses || 8),
    subscription: { planId: tier, billing: "monthly", status: "active", startedAt: joinedAt, renewsAt: null },
    stats: { memberDays: 0, savedRecipes: 0, aiConversations: 0, trackedCalories: 0, streakDays: 0 },
  };
}

function getMember(db, id) {
  return db.members.find((member) => member.id === id);
}

function getPlan(db, id) {
  return db.plans.find((plan) => plan.id === id);
}

function getFood(db, id) {
  return db.foods.find((food) => food.id === id);
}

function getRecipe(db, id) {
  return db.recipes.find((recipe) => recipe.id === id);
}

function ensureMealLog(store, memberId, date) {
  const { db } = store;
  let log = db.mealLogs.find((entry) => entry.memberId === memberId && entry.date === date);
  if (log) return log;

  const member = getMember(db, memberId);
  if (!member) notFound(null, "Member not found.");

  log = {
    id: store.nextId("log", db.mealLogs),
    memberId,
    date,
    waterGlasses: 0,
    activity: { steps: 0, burnedCalories: 0, activeMinutes: 0 },
    goals: [
      { id: "calories", label: "Calo nạp vào", done: false },
      { id: "water", label: "Uống đủ nước", done: false },
      { id: "exercise", label: "Tập thể dục", done: false },
      { id: "journal", label: "Ghi nhật ký", done: false },
    ],
    meals: [
      { id: "breakfast", name: "Bữa sáng", icon: "sunrise", targetKcal: 450, time: "07:30", items: [] },
      { id: "lunch", name: "Bữa trưa", icon: "sun", targetKcal: 620, time: "12:00", items: [] },
      { id: "dinner", name: "Bữa tối", icon: "moon", targetKcal: 500, time: "18:30", items: [] },
      { id: "snack", name: "Bữa phụ", icon: "orange", targetKcal: 200, time: "15:30", items: [] },
    ],
  };
  db.mealLogs.push(log);
  return log;
}

function summarizeMealLog(log, member) {
  const totals = log.meals.reduce(
    (sum, meal) => {
      for (const item of meal.items) {
        sum.calories += Number(item.calories) || 0;
        sum.protein += Number(item.protein) || 0;
        sum.carbs += Number(item.carbs) || 0;
        sum.fat += Number(item.fat) || 0;
      }
      return sum;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const target = member?.calorieTarget || 1800;
  return {
    totals: {
      calories: round(totals.calories),
      protein: round(totals.protein, 1),
      carbs: round(totals.carbs, 1),
      fat: round(totals.fat, 1),
    },
    targets: {
      calories: target,
      protein: member?.macroTargets?.protein || 120,
      carbs: member?.macroTargets?.carbs || 220,
      fat: member?.macroTargets?.fat || 60,
      waterGlasses: member?.waterTargetGlasses || 8,
    },
    remainingCalories: target - round(totals.calories),
    calorieProgressPct: Math.min(100, Math.round((totals.calories / target) * 100)),
  };
}

function memberResource(req, member) {
  return {
    ...member,
    _links: {
      self: link(req, `/api/members/${member.id}`),
      profile: link(req, `/api/members/${member.id}/profile`),
      dashboard: link(req, `/api/members/${member.id}/dashboard`),
      mealLogs: link(req, `/api/members/${member.id}/meal-logs`),
      payments: link(req, `/api/members/${member.id}/payments`),
      update: link(req, `/api/members/${member.id}`, "PATCH"),
      delete: link(req, `/api/members/${member.id}`, "DELETE"),
    },
  };
}

function foodResource(req, food) {
  return {
    ...food,
    _links: {
      self: link(req, `/api/foods/${food.id}`),
      collection: link(req, "/api/foods"),
      update: link(req, `/api/foods/${food.id}`, "PATCH"),
      delete: link(req, `/api/foods/${food.id}`, "DELETE"),
    },
  };
}

function mealLogResource(req, log, member) {
  const summary = summarizeMealLog(log, member);
  return {
    ...log,
    summary,
    meals: log.meals.map((meal) => ({
      ...meal,
      totalCalories: round(meal.items.reduce((sum, item) => sum + (Number(item.calories) || 0), 0)),
      _links: {
        addItem: link(req, `/api/members/${log.memberId}/meal-logs/${log.date}/meals/${meal.id}/items`, "POST"),
      },
      items: meal.items.map((item) => ({
        ...item,
        _links: {
          food: item.foodId ? link(req, `/api/foods/${item.foodId}`) : undefined,
          delete: link(req, `/api/members/${log.memberId}/meal-logs/${log.date}/meals/${meal.id}/items/${item.id}`, "DELETE"),
        },
      })),
    })),
    _links: {
      self: link(req, `/api/members/${log.memberId}/meal-logs/${log.date}`),
      member: link(req, `/api/members/${log.memberId}`),
      dashboard: link(req, `/api/members/${log.memberId}/dashboard?date=${log.date}`),
      updateWater: link(req, `/api/members/${log.memberId}/meal-logs/${log.date}/water`, "PATCH"),
    },
  };
}

function recipeResource(req, recipe) {
  return {
    ...recipe,
    _links: {
      self: link(req, `/api/recipes/${recipe.id}`),
      collection: link(req, "/api/recipes"),
      update: link(req, `/api/recipes/${recipe.id}`, "PATCH"),
      delete: link(req, `/api/recipes/${recipe.id}`, "DELETE"),
    },
  };
}

function planResource(req, plan) {
  return {
    ...plan,
    _links: {
      self: link(req, `/api/plans/${plan.id}`),
      collection: link(req, "/api/plans"),
      quote: link(req, "/api/checkout/quote", "POST"),
      checkout: link(req, "/api/payments", "POST"),
    },
  };
}

function paymentResource(req, payment) {
  return {
    ...payment,
    _links: {
      self: link(req, `/api/payments/${payment.id}`),
      member: link(req, `/api/members/${payment.memberId}`),
      plan: link(req, `/api/plans/${payment.planId}`),
    },
  };
}

function calculateCalories(db, body) {
  requireFields(body, ["age", "weightKg", "heightCm", "gender", "activityLevel", "goal"]);

  const age = Number(body.age);
  const weight = Number(body.weightKg);
  const height = Number(body.heightCm);
  if (!Number.isFinite(age) || !Number.isFinite(weight) || !Number.isFinite(height)) {
    badRequest("Age, weightKg and heightCm must be numeric.");
  }

  const activity = db.activityLevels.find((item) => item.id === body.activityLevel);
  if (!activity) badRequest("Invalid activityLevel.", { allowed: db.activityLevels.map((item) => item.id) });
  if (!["male", "female"].includes(body.gender)) badRequest("Invalid gender.", { allowed: ["male", "female"] });
  if (!["lose", "maintain", "gain"].includes(body.goal)) badRequest("Invalid goal.", { allowed: ["lose", "maintain", "gain"] });

  const bmr = body.gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const tdee = Math.round(bmr * activity.multiplier);
  const goalDelta = body.goal === "lose" ? -500 : body.goal === "gain" ? 300 : 0;
  const calorieGoal = tdee + goalDelta;
  const protein = Math.round(weight * 1.8);
  const fat = Math.round((calorieGoal * 0.25) / 9);
  const carbs = Math.round((calorieGoal - protein * 4 - fat * 9) / 4);
  const bmi = round(weight / ((height / 100) ** 2), 1);
  const exercise = db.exerciseTypes.find((item) => item.id === (body.exerciseType || "walking")) || db.exerciseTypes[0];
  const durationMinutes = Number(body.durationMinutes || 30);
  const burnedCalories = Math.round(exercise.caloriesPerMinute * durationMinutes * (weight / 70));

  return {
    input: {
      age,
      weightKg: weight,
      heightCm: height,
      gender: body.gender,
      activityLevel: activity.id,
      goal: body.goal,
      exerciseType: exercise.id,
      durationMinutes,
    },
    results: {
      bmr: Math.round(bmr),
      tdee,
      calorieGoal,
      goalDelta,
      bmi: {
        value: bmi,
        label: bmi < 18.5 ? "Thiếu cân" : bmi < 25 ? "Bình thường" : bmi < 30 ? "Thừa cân" : "Béo phì",
      },
      macros: [
        { name: "Protein", grams: protein, calories: protein * 4, pct: Math.round(((protein * 4) / calorieGoal) * 100) },
        { name: "Carbs", grams: carbs, calories: carbs * 4, pct: Math.round(((carbs * 4) / calorieGoal) * 100) },
        { name: "Chất béo", grams: fat, calories: fat * 9, pct: Math.round(((fat * 9) / calorieGoal) * 100) },
      ],
      exercise: {
        label: exercise.label,
        burnedCalories,
        fatEquivalentGrams: Math.round(burnedCalories / 9),
      },
    },
  };
}

function buildQuote(db, body) {
  requireFields(body, ["planId", "billing"]);
  const plan = getPlan(db, body.planId);
  if (!plan) badRequest("Invalid planId.", { allowed: db.plans.map((item) => item.id) });
  if (!["monthly", "annual"].includes(body.billing)) badRequest("Invalid billing.", { allowed: ["monthly", "annual"] });

  const months = body.billing === "annual" ? 12 : 1;
  const monthlyPrice = body.billing === "annual" ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice;
  const subtotal = monthlyPrice * months;
  const vat = Math.round(subtotal * 0.1);
  const discountCode = String(body.discountCode || "").trim().toUpperCase();
  const discountRate = discountCode === "NUTRIPATH10" ? 0.1 : 0;
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal + vat - discountAmount;

  return {
    planId: plan.id,
    planName: plan.name,
    billing: body.billing,
    months,
    currency: "VND",
    monthlyPrice,
    subtotal,
    vat,
    discountCode: discountRate ? discountCode : null,
    discountAmount,
    total,
  };
}

function cannedChatResponse(db, text) {
  const cleaned = String(text || "").trim();
  return db.chat.cannedResponses[cleaned]
    || `Cảm ơn câu hỏi của bạn về "${cleaned}". Bạn cho tôi biết thêm mục tiêu sức khỏe, khẩu phần hoặc món đã ăn để tôi tư vấn thực đơn Việt phù hợp hơn nhé.`;
}

route("GET", "/", async ({ req }) => ({
  name: "NutriPath Backend",
  description: "REST API using HAL-style HATEOAS links.",
  _links: {
    self: currentLink(req),
    api: link(req, "/api"),
    docs: link(req, "/api"),
  },
}));

route("GET", "/api", async ({ req }) => ({
  name: "NutriPath API",
  version: "1.0.0",
  mediaType: "application/hal+json",
  _links: {
    self: currentLink(req),
    health: link(req, "/api/health"),
    auth: link(req, "/api/auth/me"),
    login: link(req, "/api/auth/login", "POST"),
    register: link(req, "/api/auth/register", "POST"),
    logout: link(req, "/api/auth/logout", "POST"),
    members: link(req, "/api/members"),
    foods: link(req, "/api/foods"),
    recipes: link(req, "/api/recipes"),
    plans: link(req, "/api/plans"),
    faqs: link(req, "/api/faqs"),
    calorieCalculator: link(req, "/api/calculations/calorie", "POST"),
    checkoutQuote: link(req, "/api/checkout/quote", "POST"),
    payments: link(req, "/api/payments", "POST"),
    chat: link(req, "/api/chat/messages", "POST"),
    adminOverview: link(req, "/api/admin/overview"),
  },
}));

route("GET", "/api/health", async ({ req, store }) => ({
  status: "ok",
  dbPath: store.filePath,
  time: new Date().toISOString(),
  _links: apiLinks(req),
}));

route("POST", "/api/dev/reset", async ({ req, store }) => {
  await store.reset();
  return {
    status: "reset",
    _links: {
      self: currentLink(req),
      api: link(req, "/api"),
    },
  };
});

route("GET", "/api/calculations/activity-levels", async ({ req, store }) => collectionResponse(
  req,
  "activityLevels",
  store.db.activityLevels,
  { itemMapper: (item) => ({ ...item, _links: { self: link(req, `/api/calculations/activity-levels#${item.id}`) } }) },
));

route("GET", "/api/calculations/exercise-types", async ({ req, store }) => collectionResponse(
  req,
  "exerciseTypes",
  store.db.exerciseTypes,
  { itemMapper: (item) => ({ ...item, _links: { self: link(req, `/api/calculations/exercise-types#${item.id}`) } }) },
));

route("POST", "/api/calculations/calorie", async ({ req, store, body }) => ({
  ...calculateCalories(store.db, body),
  _links: {
    self: currentLink(req),
    activityLevels: link(req, "/api/calculations/activity-levels"),
    exerciseTypes: link(req, "/api/calculations/exercise-types"),
    login: link(req, "/api/auth/login", "POST"),
  },
}));

route("POST", "/api/auth/register", async ({ req, store, body }) => {
  requireFields(body, ["name", "email", "password"]);
  const email = normalizeEmail(body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) badRequest("Email không hợp lệ.");

  const password = String(body.password);
  if (password.length < 6) badRequest("Mật khẩu cần ít nhất 6 ký tự.");

  const credentials = ensureAuthCredentials(store.db);
  if (findCredentialByEmail(store.db, email)) {
    conflict("Email này đã có tài khoản đăng nhập.");
  }

  let member = findMemberByEmail(store.db, email);
  const isNewMember = !member;
  if (!member) {
    member = memberFromRegistration(store, { ...body, email });
  }

  const hashed = hashPassword(password);
  const credential = {
    id: store.nextId("auth", credentials),
    memberId: member.id,
    email,
    passwordHash: hashed.passwordHash,
    passwordSalt: hashed.passwordSalt,
    createdAt: new Date().toISOString(),
  };

  if (store.dataSource === "sqlserver") {
    if (isNewMember) await insertSqlServerAuthMember(member, credential);
    else await insertSqlServerCredential(credential);
    await store.reload();
    member = getMember(store.db, credential.memberId);
  } else {
    if (isNewMember) store.db.members.push(member);
    credentials.push(credential);
    await store.save();
  }

  return authSessionResponse(req, member);
});

route("POST", "/api/auth/login", async ({ req, store, body }) => {
  requireFields(body, ["email", "password"]);
  const email = normalizeEmail(body.email);
  const credential = findCredentialByEmail(store.db, email);

  if (!credential || !verifyPassword(body.password, credential)) {
    unauthorized("Email hoặc mật khẩu không đúng.");
  }

  const member = getMember(store.db, credential.memberId) || findMemberByEmail(store.db, email);
  if (!member) unauthorized("Tài khoản chưa gắn với hồ sơ thành viên.");

  return authSessionResponse(req, member);
});

route("GET", "/api/auth/me", async ({ req, store }) => {
  const { member } = requireSession(req, store);
  return {
    member: memberResource(req, member),
    _links: {
      self: currentLink(req),
      logout: link(req, "/api/auth/logout", "POST"),
      dashboard: link(req, `/api/members/${member.id}/dashboard`),
      profile: link(req, `/api/members/${member.id}/profile`),
    },
  };
});

route("POST", "/api/auth/logout", async ({ req }) => {
  const token = getBearerToken(req);
  if (token) sessions.delete(token);
  return {
    loggedOut: true,
    _links: {
      self: currentLink(req),
      login: link(req, "/api/auth/login", "POST"),
      register: link(req, "/api/auth/register", "POST"),
      api: link(req, "/api"),
    },
  };
});

route("GET", "/api/members", async ({ req, store, url }) => {
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const tier = url.searchParams.get("tier");
  const members = store.db.members.filter((member) => {
    const matchSearch = !search || member.name.toLowerCase().includes(search) || member.email.toLowerCase().includes(search);
    const matchTier = !tier || member.tier === tier;
    return matchSearch && matchTier;
  });

  return collectionResponse(req, "members", members, {
    itemMapper: (member) => memberResource(req, member),
    links: { create: link(req, "/api/members", "POST") },
    meta: { filters: { search, tier } },
  });
});

route("POST", "/api/members", async ({ req, store, body }) => {
  requireFields(body, ["name", "email"]);
  const member = {
    id: store.nextId("mem", store.db.members),
    name: body.name,
    email: body.email,
    initials: body.initials || body.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    role: "member",
    status: "active",
    tier: body.tier || "free",
    gender: body.gender || "female",
    age: Number(body.age || 25),
    weightKg: Number(body.weightKg || 65),
    heightCm: Number(body.heightCm || 168),
    activityLevel: body.activityLevel || "light",
    goal: body.goal || "maintain",
    joinedAt: new Date().toISOString().slice(0, 10),
    calorieTarget: Number(body.calorieTarget || 1800),
    macroTargets: body.macroTargets || { protein: 120, carbs: 220, fat: 60 },
    waterTargetGlasses: Number(body.waterTargetGlasses || 8),
    subscription: { planId: body.tier || "free", billing: "monthly", status: "active", startedAt: new Date().toISOString().slice(0, 10), renewsAt: null },
    stats: { memberDays: 0, savedRecipes: 0, aiConversations: 0, trackedCalories: 0, streakDays: 0 },
  };
  store.db.members.push(member);
  await store.save();
  return memberResource(req, member);
});

route("GET", "/api/members/:id", async ({ req, store, params }) => {
  const member = getMember(store.db, params.id);
  if (!member) notFound(req, "Member not found.");
  return memberResource(req, member);
});

route("PATCH", "/api/members/:id", async ({ req, store, params, body }) => {
  const member = getMember(store.db, params.id);
  if (!member) notFound(req, "Member not found.");
  Object.assign(member, body, { id: member.id });
  await store.save();
  return memberResource(req, member);
});

route("DELETE", "/api/members/:id", async ({ req, store, params }) => {
  const before = store.db.members.length;
  store.db.members = store.db.members.filter((member) => member.id !== params.id);
  if (store.db.members.length === before) notFound(req, "Member not found.");
  await store.save();
  return {
    deleted: params.id,
    _links: {
      collection: link(req, "/api/members"),
      api: link(req, "/api"),
    },
  };
});

route("GET", "/api/members/:memberId/profile", async ({ req, store, params }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  const plan = getPlan(store.db, member.subscription?.planId || member.tier);
  const payments = store.db.payments.filter((payment) => payment.memberId === member.id);
  return {
    member: memberResource(req, member),
    plan: plan ? planResource(req, plan) : null,
    benefits: plan?.features || [],
    billingHistory: payments.map((payment) => paymentResource(req, payment)),
    _links: {
      self: currentLink(req),
      member: link(req, `/api/members/${member.id}`),
      payments: link(req, `/api/members/${member.id}/payments`),
      plans: link(req, "/api/plans"),
      checkout: link(req, "/api/payments", "POST"),
    },
  };
});

route("GET", "/api/members/:memberId/dashboard", async ({ req, store, params, url }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  const date = url.searchParams.get("date") || "2026-03-13";
  const log = ensureMealLog(store, member.id, date);
  const summary = summarizeMealLog(log, member);

  return {
    date,
    greeting: `Xin chào, ${member.name}`,
    member: memberResource(req, member),
    nutrition: summary,
    mealLog: mealLogResource(req, log, member),
    weeklyProgress: store.db.weeklyProgress,
    tips: [
      "Uống 1 ly nước trước bữa ăn 30 phút để giảm lượng calo nạp vào.",
      "Ăn chậm, nhai kỹ giúp cơ thể nhận tín hiệu no đúng lúc.",
      "Bổ sung rau xanh vào mỗi bữa ăn để tăng chất xơ.",
    ],
    achievements: [
      { id: "streak", label: "7 ngày liên tiếp", description: "Ghi lại bữa ăn" },
      { id: "water", label: "Đủ nước 5 ngày", description: "2L mỗi ngày" },
      { id: "calorie-target", label: "Đạt calo mục tiêu", description: "3 ngày trong tuần" },
    ],
    _links: {
      self: currentLink(req),
      member: link(req, `/api/members/${member.id}`),
      mealLog: link(req, `/api/members/${member.id}/meal-logs/${date}`),
      foods: link(req, "/api/foods"),
      recipes: link(req, "/api/recipes"),
      chat: link(req, "/api/chat/messages", "POST"),
    },
  };
});

route("GET", "/api/members/:memberId/payments", async ({ req, store, params }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  const payments = store.db.payments.filter((payment) => payment.memberId === member.id);
  return collectionResponse(req, "payments", payments, {
    itemMapper: (payment) => paymentResource(req, payment),
    links: { create: link(req, "/api/payments", "POST"), member: link(req, `/api/members/${member.id}`) },
  });
});

route("GET", "/api/foods", async ({ req, store, url }) => {
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const category = url.searchParams.get("category");
  const foods = store.db.foods.filter((food) => {
    const matchSearch = !search || food.name.toLowerCase().includes(search);
    const matchCategory = !category || food.category === category;
    return matchSearch && matchCategory;
  });
  const categories = [...new Set(store.db.foods.map((food) => food.category))].sort();
  return collectionResponse(req, "foods", foods, {
    itemMapper: (food) => foodResource(req, food),
    links: { create: link(req, "/api/foods", "POST") },
    meta: { filters: { search, category }, categories },
  });
});

route("POST", "/api/foods", async ({ req, store, body }) => {
  requireFields(body, ["name", "calories", "protein", "carbs", "fat", "portion"]);
  const food = {
    id: store.nextId("food", store.db.foods),
    name: body.name,
    category: body.category || "Khác",
    calories: Number(body.calories),
    protein: Number(body.protein),
    carbs: Number(body.carbs),
    fat: Number(body.fat),
    portion: body.portion,
  };
  store.db.foods.push(food);
  await store.save();
  return foodResource(req, food);
});

route("GET", "/api/foods/:id", async ({ req, store, params }) => {
  const food = getFood(store.db, params.id);
  if (!food) notFound(req, "Food not found.");
  return foodResource(req, food);
});

route("PATCH", "/api/foods/:id", async ({ req, store, params, body }) => {
  const food = getFood(store.db, params.id);
  if (!food) notFound(req, "Food not found.");
  Object.assign(food, body, { id: food.id });
  await store.save();
  return foodResource(req, food);
});

route("DELETE", "/api/foods/:id", async ({ req, store, params }) => {
  const before = store.db.foods.length;
  store.db.foods = store.db.foods.filter((food) => food.id !== params.id);
  if (store.db.foods.length === before) notFound(req, "Food not found.");
  await store.save();
  return { deleted: params.id, _links: { collection: link(req, "/api/foods") } };
});

route("GET", "/api/members/:memberId/meal-logs", async ({ req, store, params, url }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  const date = url.searchParams.get("date");
  const logs = store.db.mealLogs.filter((log) => log.memberId === member.id && (!date || log.date === date));
  return collectionResponse(req, "mealLogs", logs, {
    itemMapper: (log) => mealLogResource(req, log, member),
    links: {
      member: link(req, `/api/members/${member.id}`),
      create: link(req, `/api/members/${member.id}/meal-logs`, "POST"),
    },
  });
});

route("POST", "/api/members/:memberId/meal-logs", async ({ req, store, params, body }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  requireFields(body, ["date"]);
  const existing = store.db.mealLogs.find((log) => log.memberId === member.id && log.date === body.date);
  if (existing) return mealLogResource(req, existing, member);
  const log = ensureMealLog(store, member.id, body.date);
  await store.save();
  return mealLogResource(req, log, member);
});

route("GET", "/api/members/:memberId/meal-logs/:date", async ({ req, store, params }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  const log = ensureMealLog(store, member.id, params.date);
  await store.save();
  return mealLogResource(req, log, member);
});

route("PATCH", "/api/members/:memberId/meal-logs/:date/water", async ({ req, store, params, body }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  const log = ensureMealLog(store, member.id, params.date);
  requireFields(body, ["waterGlasses"]);
  log.waterGlasses = Math.max(0, Number(body.waterGlasses));
  log.goals = log.goals.map((goal) => goal.id === "water"
    ? { ...goal, done: log.waterGlasses >= (member.waterTargetGlasses || 8) }
    : goal);
  await store.save();
  return mealLogResource(req, log, member);
});

route("POST", "/api/members/:memberId/meal-logs/:date/meals/:mealId/items", async ({ req, store, params, body }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  const log = ensureMealLog(store, member.id, params.date);
  const meal = log.meals.find((entry) => entry.id === params.mealId);
  if (!meal) notFound(req, "Meal section not found.");

  let source = null;
  if (body.foodId) {
    source = getFood(store.db, body.foodId);
    if (!source) notFound(req, "Food not found.");
  }
  const quantity = Math.max(0.1, Number(body.quantity || 1));
  const item = {
    id: store.nextId("item", meal.items),
    foodId: source?.id || body.foodId || null,
    name: body.name || source?.name,
    calories: round(Number(body.calories ?? source?.calories ?? 0) * quantity, 1),
    protein: round(Number(body.protein ?? source?.protein ?? 0) * quantity, 1),
    carbs: round(Number(body.carbs ?? source?.carbs ?? 0) * quantity, 1),
    fat: round(Number(body.fat ?? source?.fat ?? 0) * quantity, 1),
    portion: body.portion || source?.portion || "1 phần",
    quantity,
  };
  if (!item.name) badRequest("Either foodId or name is required.");
  meal.items.push(item);
  log.goals = log.goals.map((goal) => goal.id === "journal" ? { ...goal, done: true } : goal);
  await store.save();
  return mealLogResource(req, log, member);
});

route("DELETE", "/api/members/:memberId/meal-logs/:date/meals/:mealId/items/:itemId", async ({ req, store, params }) => {
  const member = getMember(store.db, params.memberId);
  if (!member) notFound(req, "Member not found.");
  const log = ensureMealLog(store, member.id, params.date);
  const meal = log.meals.find((entry) => entry.id === params.mealId);
  if (!meal) notFound(req, "Meal section not found.");
  const before = meal.items.length;
  meal.items = meal.items.filter((item) => item.id !== params.itemId);
  if (meal.items.length === before) notFound(req, "Meal item not found.");
  await store.save();
  return mealLogResource(req, log, member);
});

route("GET", "/api/recipes", async ({ req, store, url }) => {
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const tag = url.searchParams.get("tag");
  const maxCalories = Number(url.searchParams.get("maxCalories") || 0);
  const difficulty = Number(url.searchParams.get("difficulty") || 0);
  const recipes = store.db.recipes.filter((recipe) => {
    const matchSearch = !search || recipe.name.toLowerCase().includes(search)
      || recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(search));
    const matchTag = !tag || tag === "Tất cả" || recipe.tags.includes(tag);
    const matchCalories = !maxCalories || recipe.calories <= maxCalories;
    const matchDifficulty = !difficulty || recipe.difficulty === difficulty;
    return matchSearch && matchTag && matchCalories && matchDifficulty;
  });
  const tags = [...new Set(store.db.recipes.flatMap((recipe) => recipe.tags))].sort();
  return collectionResponse(req, "recipes", recipes, {
    itemMapper: (recipe) => recipeResource(req, recipe),
    links: { create: link(req, "/api/recipes", "POST") },
    meta: { filters: { search, tag, maxCalories: maxCalories || null, difficulty: difficulty || null }, tags },
  });
});

route("POST", "/api/recipes", async ({ req, store, body }) => {
  requireFields(body, ["name", "calories", "timeMinutes", "servings"]);
  const recipe = {
    id: store.nextId("recipe", store.db.recipes),
    name: body.name,
    image: body.image || "",
    timeMinutes: Number(body.timeMinutes),
    calories: Number(body.calories),
    difficulty: Number(body.difficulty || 1),
    tags: Array.isArray(body.tags) ? body.tags : [],
    servings: Number(body.servings),
    ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
    steps: Array.isArray(body.steps) ? body.steps : [],
    nutrition: body.nutrition || { protein: 0, carbs: 0, fat: 0, fiber: 0 },
  };
  store.db.recipes.push(recipe);
  await store.save();
  return recipeResource(req, recipe);
});

route("GET", "/api/recipes/:id", async ({ req, store, params }) => {
  const recipe = getRecipe(store.db, params.id);
  if (!recipe) notFound(req, "Recipe not found.");
  return recipeResource(req, recipe);
});

route("PATCH", "/api/recipes/:id", async ({ req, store, params, body }) => {
  const recipe = getRecipe(store.db, params.id);
  if (!recipe) notFound(req, "Recipe not found.");
  Object.assign(recipe, body, { id: recipe.id });
  await store.save();
  return recipeResource(req, recipe);
});

route("DELETE", "/api/recipes/:id", async ({ req, store, params }) => {
  const before = store.db.recipes.length;
  store.db.recipes = store.db.recipes.filter((recipe) => recipe.id !== params.id);
  if (store.db.recipes.length === before) notFound(req, "Recipe not found.");
  await store.save();
  return { deleted: params.id, _links: { collection: link(req, "/api/recipes") } };
});

route("GET", "/api/plans", async ({ req, store, url }) => {
  const billing = url.searchParams.get("billing") || "monthly";
  const plans = store.db.plans.map((plan) => {
    const quoted = buildQuote(store.db, { planId: plan.id, billing: billing === "annual" ? "annual" : "monthly" });
    return { ...plan, pricePreview: quoted, _links: planResource(req, plan)._links };
  });
  return collectionResponse(req, "plans", plans, {
    itemMapper: (plan) => plan,
    meta: { billing },
    links: { quote: link(req, "/api/checkout/quote", "POST") },
  });
});

route("GET", "/api/plans/:id", async ({ req, store, params }) => {
  const plan = getPlan(store.db, params.id);
  if (!plan) notFound(req, "Plan not found.");
  return planResource(req, plan);
});

route("GET", "/api/faqs", async ({ req, store }) => collectionResponse(
  req,
  "faqs",
  store.db.faqs,
  { itemMapper: (faq) => ({ ...faq, _links: { self: link(req, `/api/faqs#${faq.id}`) } }) },
));

route("POST", "/api/checkout/quote", async ({ req, store, body }) => ({
  quote: buildQuote(store.db, body),
  _links: {
    self: currentLink(req),
    plans: link(req, "/api/plans"),
    pay: link(req, "/api/payments", "POST"),
  },
}));

route("POST", "/api/payments", async ({ req, store, body }) => {
  requireFields(body, ["memberId", "planId", "billing", "paymentMethod"]);
  const member = getMember(store.db, body.memberId);
  if (!member) notFound(req, "Member not found.");
  const plan = getPlan(store.db, body.planId);
  if (!plan) notFound(req, "Plan not found.");
  const quote = buildQuote(store.db, body);
  const now = new Date();
  const renews = new Date(now);
  renews.setMonth(renews.getMonth() + (body.billing === "annual" ? 12 : 1));
  const payment = {
    id: store.nextId("pay", store.db.payments),
    memberId: member.id,
    invoice: `INV-${now.getFullYear()}-${String(store.db.payments.length + 1).padStart(4, "0")}`,
    planId: plan.id,
    billing: body.billing,
    paymentMethod: body.paymentMethod,
    amount: quote.total,
    currency: "VND",
    status: "paid",
    paidAt: now.toISOString(),
  };
  store.db.payments.unshift(payment);
  member.tier = plan.id;
  member.subscription = {
    planId: plan.id,
    billing: body.billing,
    status: "active",
    startedAt: now.toISOString().slice(0, 10),
    renewsAt: renews.toISOString().slice(0, 10),
  };
  await store.save();
  return {
    payment: paymentResource(req, payment),
    member: memberResource(req, member),
    quote,
    note: "Card number, CVV and other sensitive payment details are intentionally not stored.",
    _links: {
      self: link(req, `/api/payments/${payment.id}`),
      profile: link(req, `/api/members/${member.id}/profile`),
      dashboard: link(req, `/api/members/${member.id}/dashboard`),
    },
  };
});

route("GET", "/api/payments/:id", async ({ req, store, params }) => {
  const payment = store.db.payments.find((item) => item.id === params.id);
  if (!payment) notFound(req, "Payment not found.");
  return paymentResource(req, payment);
});

route("GET", "/api/chat/quick-replies", async ({ req, store }) => ({
  quickReplies: store.db.chat.quickReplies,
  _links: {
    self: currentLink(req),
    sendMessage: link(req, "/api/chat/messages", "POST"),
  },
}));

route("POST", "/api/chat/messages", async ({ req, store, body }) => {
  requireFields(body, ["text"]);
  const member = body.memberId ? getMember(store.db, body.memberId) : null;
  const time = new Date().toISOString();
  const userMessage = {
    id: store.nextId("msg", []),
    sender: "user",
    text: body.text,
    time,
  };
  const aiMessage = {
    id: store.nextId("msg", []),
    sender: "ai",
    text: cannedChatResponse(store.db, body.text),
    time,
  };
  if (member) {
    member.stats.aiConversations = (member.stats.aiConversations || 0) + 1;
    await store.save();
  }
  return {
    messages: [userMessage, aiMessage],
    quickReplies: store.db.chat.quickReplies,
    _links: {
      self: currentLink(req),
      quickReplies: link(req, "/api/chat/quick-replies"),
      member: member ? link(req, `/api/members/${member.id}`) : undefined,
      recipes: link(req, "/api/recipes"),
      calorieCalculator: link(req, "/api/calculations/calorie", "POST"),
    },
  };
});

route("GET", "/api/admin/overview", async ({ req, store }) => ({
  kpis: store.db.admin.kpis,
  systemServices: store.db.admin.systemServices,
  topRecipes: store.db.recipes.slice(0, 5).map((recipe, index) => ({
    rank: index + 1,
    id: recipe.id,
    name: recipe.name,
    searches: 18420 - index * 1900,
    trend: index === 3 ? "down" : "up",
  })),
  _links: {
    self: currentLink(req),
    users: link(req, "/api/admin/users"),
    content: link(req, "/api/admin/content"),
    analytics: link(req, "/api/admin/analytics"),
    aiSettings: link(req, "/api/admin/settings/ai"),
    security: link(req, "/api/admin/security"),
  },
}));

route("GET", "/api/admin/users", async ({ req, store, url }) => {
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");
  const users = store.db.admin.users.filter((user) => {
    const matchSearch = !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    const matchRole = !role || role === "Tất cả" || user.role === role;
    const matchStatus = !status || status === "Tất cả" || user.status === status;
    return matchSearch && matchRole && matchStatus;
  });
  return collectionResponse(req, "users", users, {
    itemMapper: (user) => ({ ...user, _links: { self: link(req, `/api/admin/users/${user.id}`) } }),
    links: { overview: link(req, "/api/admin/overview") },
  });
});

route("GET", "/api/admin/content", async ({ req, store }) => ({
  foods: store.db.foods.map((food) => foodResource(req, food)),
  recipes: store.db.recipes.map((recipe) => recipeResource(req, recipe)),
  mealPlans: [
    { id: "mp-001", name: "Kế hoạch giảm cân 7 ngày", target: "Giảm cân", calories: 1500, meals: 21, status: "active" },
    { id: "mp-002", name: "Tăng cơ cho nam giới", target: "Tăng cơ", calories: 2800, meals: 28, status: "active" },
    { id: "mp-003", name: "Ăn chay thuần Việt", target: "Sức khỏe", calories: 1800, meals: 21, status: "draft" },
  ],
  _links: {
    self: currentLink(req),
    foods: link(req, "/api/foods"),
    recipes: link(req, "/api/recipes"),
    overview: link(req, "/api/admin/overview"),
  },
}));

route("GET", "/api/admin/analytics", async ({ req, store }) => ({
  dailyMeals: [
    { day: "T2", meals: 3240 },
    { day: "T3", meals: 2980 },
    { day: "T4", meals: 3560 },
    { day: "T5", meals: 4120 },
    { day: "T6", meals: 4800 },
    { day: "T7", meals: 5200 },
    { day: "CN", meals: 4650 },
  ],
  nutritionShare: [
    { name: "Carbs", value: 45 },
    { name: "Protein", value: 30 },
    { name: "Chất béo", value: 25 },
  ],
  topDishes: store.db.foods.slice(0, 10).map((food, index) => ({
    rank: index + 1,
    dish: food.name,
    searches: 18420 - index * 1300,
    calories: food.calories,
    category: food.category,
  })),
  _links: {
    self: currentLink(req),
    overview: link(req, "/api/admin/overview"),
    users: link(req, "/api/admin/users"),
  },
}));

route("GET", "/api/admin/system", async ({ req, store }) => ({
  services: store.db.admin.systemServices,
  _links: {
    self: currentLink(req),
    overview: link(req, "/api/admin/overview"),
  },
}));

route("GET", "/api/admin/settings/ai", async ({ req, store }) => ({
  settings: store.db.admin.aiSettings,
  _links: {
    self: currentLink(req),
    update: link(req, "/api/admin/settings/ai", "PATCH"),
    overview: link(req, "/api/admin/overview"),
  },
}));

route("PATCH", "/api/admin/settings/ai", async ({ req, store, body }) => {
  store.db.admin.aiSettings = { ...store.db.admin.aiSettings, ...body };
  await store.save();
  return {
    settings: store.db.admin.aiSettings,
    _links: {
      self: link(req, "/api/admin/settings/ai"),
      update: link(req, "/api/admin/settings/ai", "PATCH"),
    },
  };
});

route("GET", "/api/admin/security", async ({ req, store }) => ({
  security: store.db.admin.security,
  _links: {
    self: currentLink(req),
    update: link(req, "/api/admin/security", "PATCH"),
    overview: link(req, "/api/admin/overview"),
  },
}));

route("PATCH", "/api/admin/security", async ({ req, store, body }) => {
  store.db.admin.security = { ...store.db.admin.security, ...body };
  await store.save();
  return {
    security: store.db.admin.security,
    _links: {
      self: link(req, "/api/admin/security"),
      update: link(req, "/api/admin/security", "PATCH"),
    },
  };
});

export async function createServer(options = {}) {
  const store = await createStore(options);

  return http.createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        sendJson(req, res, 204, {});
        return;
      }

      const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1:8080"}`);
      const pathname = normalizePath(requestUrl.pathname);
      const matched = routes.find((candidate) => candidate.method === req.method && matchRoute(candidate.pattern, pathname));

      if (!matched) {
        sendJson(req, res, 404, errorResponse(req, 404, "not_found", `No route for ${req.method} ${pathname}.`));
        return;
      }

      const params = matchRoute(matched.pattern, pathname);
      const body = ["POST", "PATCH", "PUT"].includes(req.method) ? await readBody(req) : {};
      const payload = await matched.handler({
        req,
        res,
        store,
        url: requestUrl,
        params,
        body: cloneRecord(body),
      });

      const status = req.method === "POST" ? 201 : 200;
      sendJson(req, res, status, payload);
    } catch (error) {
      const status = error.status || 500;
      const code = error.code || "internal_error";
      const message = status === 500 ? "Unexpected server error." : error.message;
      if (status === 500) console.error(error);
      sendJson(req, res, status, errorResponse(req, status, code, message, error.details));
    }
  });
}
