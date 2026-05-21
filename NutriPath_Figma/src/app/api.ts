const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080";
const SESSION_KEY = "nutripath_session";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type RequestBody = Record<string, unknown> | unknown[];

export interface AuthSession {
  token: string;
  expiresAt?: string;
  member: Member;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  gender?: "male" | "female";
  age?: number;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: string;
  goal?: "lose" | "maintain" | "gain";
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session?.token || !session?.member?.id) return null;
    return session;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setStoredSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function syncStoredMember(member: Member) {
  if (typeof window === "undefined") return;
  const current = getStoredSession();
  if (!current) return;
  const nextSession = { ...current, member };
  setStoredSession(nextSession);
  window.dispatchEvent(new CustomEvent("nutripath:member-updated", { detail: { member } }));
}

export function getCurrentMemberId() {
  const memberId = getStoredSession()?.member.id;
  if (!memberId) throw new Error("Bạn cần đăng nhập để xem dữ liệu cá nhân.");
  return memberId;
}

export async function apiFetch<T>(path: string, options: { method?: string; body?: RequestBody; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = options.auth === false ? null : getStoredSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `API request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  initials: string;
  role?: "member" | "admin" | "moderator";
  status?: string;
  tier: "free" | "vip" | "svip";
  joinedAt: string;
  calorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fat: number;
  };
  waterTargetGlasses: number;
  gender?: "male" | "female";
  age?: number;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: string;
  goal?: "lose" | "maintain" | "gain";
  nutritionProfile?: NutritionProfile | null;
  access?: {
    tier: "free" | "vip" | "svip";
    recipeLimit: number | null;
    advancedAiContext: boolean;
    aiCoach: boolean;
    mealHistoryDays: number;
    mealItemsPerDay: number;
    analyticsWindowDays: number;
    reportExports: boolean;
  };
  subscription?: {
    planId: string;
    billing: string;
    status: string;
    startedAt: string;
    renewsAt?: string | null;
    daysTotal?: number;
    daysRemaining?: number;
  };
  stats?: {
    memberDays: number;
    savedRecipes: number;
    aiConversations: number;
    trackedCalories: number;
    streakDays: number;
  };
}

export interface NutritionProfile {
  updatedAt: string;
  input: {
    age: number;
    weightKg: number;
    heightCm: number;
    gender: "male" | "female";
    activityLevel: string;
    goal: "lose" | "maintain" | "gain";
    exerciseType: string;
    durationMinutes: number;
  };
  results: {
    bmr: number;
    tdee: number;
    calorieGoal: number;
    goalDelta: number;
    formula?: string;
    accuracy?: {
      label: string;
      note: string;
    };
    bmi: {
      value: number;
      label: string;
    };
    macros: Array<{
      name: string;
      grams: number;
      calories: number;
      pct: number;
    }>;
    exercise: {
      label: string;
      burnedCalories: number;
      fatEquivalentGrams: number;
    };
    warnings?: string[];
  };
  aiInsight?: {
    summary: string;
    calorieStrategy: string;
    macroStrategy: string;
    mealTiming: string;
    actionSteps: string[];
    cautions: string[];
    generatedAt: string;
  };
}

export interface CalorieCalculationInput {
  age: number;
  weightKg: number;
  heightCm: number;
  gender: "male" | "female";
  activityLevel: string;
  goal: "lose" | "maintain" | "gain";
  exerciseType?: string;
  durationMinutes?: number;
}

export interface CalorieCalculation {
  input: NutritionProfile["input"];
  results: NutritionProfile["results"];
  aiInsight?: NutritionProfile["aiInsight"];
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  category?: string;
}

export interface MealItem extends Food {
  quantity: number;
  foodId?: string;
}

export interface MealSection {
  id: string;
  name: string;
  icon: string;
  targetKcal: number;
  time: string;
  totalCalories: number;
  items: MealItem[];
}

export interface MealLog {
  id: string;
  memberId: string;
  date: string;
  access?: {
    tier: "free" | "vip" | "svip";
    recipeLimit: number | null;
    advancedAiContext: boolean;
    aiCoach: boolean;
    mealHistoryDays: number;
    mealItemsPerDay: number;
    analyticsWindowDays: number;
    reportExports: boolean;
    itemCount: number;
    remainingItemsForDay: number;
  };
  waterGlasses: number;
  activity: {
    steps: number;
    burnedCalories: number;
    activeMinutes: number;
  };
  goals: Array<{ id: string; label: string; done: boolean }>;
  meals: MealSection[];
  summary: {
    totals: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    targets: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      waterGlasses: number;
    };
    remainingCalories: number;
    calorieProgressPct: number;
  };
}

export interface FoodPhotoEstimate {
  dishName: string;
  portion: string;
  servingEstimate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  items: Array<{ name: string; estimatedGrams: number; calories: number }>;
  assumptions: string[];
  accuracyTips: string[];
  disclaimer: string;
  analysisMode?: "standard_ai_vision" | "svip_vision_only" | "svip_full_ai" | string;
  refinedBy?: string[];
}

export interface AddMealItemPayload {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  quantity?: number;
}

export interface CustomFoodUnit {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

export interface NutritionIngredient {
  id: string;
  name: string;
  aliases: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultUnits: Record<string, number>;
}

export interface CustomFoodIngredientInput {
  name: string;
  quantity: number;
  unit: string;
  note?: string;
}

export interface CustomFoodEstimate {
  dishName: string;
  servings: number;
  cookingMethod: string;
  ingredients: Array<{
    inputName: string;
    matchedName: string;
    quantity: number;
    unit: string;
    unitLabel: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    note?: string;
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  perServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence: {
    level: "high" | "medium" | "low";
    label: string;
    reason: string;
  };
  disclaimer: string;
  suggestions: string[];
}

export interface CustomFoodEstimateResponse {
  needsMoreInfo: boolean;
  question?: string;
  quickEstimate?: {
    dishName: string;
    caloriesRange: [number, number];
    proteinRange: [number, number];
    confidence: string;
    note: string;
  } | null;
  unresolved?: Array<{ inputName: string; quantity: number; unit: string; reason: string }>;
  recognized?: CustomFoodEstimate["ingredients"];
  suggestions?: string[];
  estimate?: CustomFoodEstimate;
  addableItem?: AddMealItemPayload;
  logic?: {
    formula: string;
    macroFormula: string;
    servingFormula: string;
    reminder: string;
  };
}

export interface SavedCustomFood extends AddMealItemPayload {
  id: string;
  memberId: string;
  servings: number;
  cookingMethod?: string;
  ingredients?: CustomFoodEstimate["ingredients"];
  confidence?: CustomFoodEstimate["confidence"] | null;
  disclaimer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  date: string;
  greeting: string;
  member: Member;
  nutrition: MealLog["summary"];
  mealLog: MealLog;
  weeklyProgress: Array<{ date: string; day: string; consumed: number; target: number }>;
  tips: string[];
  achievements: Array<{ id: string; label: string; description: string }>;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  timeMinutes: number;
  calories: number;
  difficulty: number;
  tags: string[];
  servings: number;
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface RecipeCollectionMeta {
  access?: {
    tier: "free" | "vip" | "svip";
    recipeLimit: number | null;
    totalAvailable: number;
    upgradeRequired: boolean;
  };
}

export interface PersonalizedRecipe extends Omit<Recipe, "ingredients"> {
  memberId?: string;
  savedAt?: string;
  imagePrompt: string;
  mealTime: string;
  recommendedEatingTime: string;
  ingredients: Array<{
    name: string;
    amount: string;
    grams?: number | null;
    note?: string;
  }>;
  notes: string[];
  personalizationSummary: string;
  generatedAt: string;
  generatedBy: "ai";
}

export interface PersonalizedRecipeQuestion {
  id: string;
  label: string;
  question: string;
}

export interface PersonalizedRecipeResponse {
  status: "needs_questions" | "recipe";
  message?: string;
  questions?: PersonalizedRecipeQuestion[];
  recipe?: PersonalizedRecipe;
}

export interface Plan {
  id: "free" | "vip" | "svip";
  name: string;
  monthlyPrice: number;
  period: string;
  description: string;
  features: Array<{ label: string; included: boolean }>;
  pricePreview?: {
    total: number;
    monthlyPrice: number;
    subtotal: number;
    vat: number;
    discountAmount: number;
    billing: string;
    currency: string;
  };
}

export interface Payment {
  id: string;
  memberId: string;
  invoice: string;
  planId: string;
  billing: string;
  paymentMethod?: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
}

export interface CheckoutQuote {
  planId: string;
  planName: string;
  billing: "monthly" | "annual";
  months: number;
  currency: string;
  monthlyPrice: number;
  subtotal: number;
  vat: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
}

export interface PaymentPayload {
  memberId: string;
  planId: "vip" | "svip";
  billing: "monthly" | "annual";
  paymentMethod: "card" | "momo" | "zalopay" | "bank";
  discountCode?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
}

export interface ChatResponse {
  messages: ChatMessage[];
  quickReplies: string[];
  mode?: "assistant" | "coach";
  adminOverride?: boolean;
  intent?: "set_calorie_goal" | "reject_calorie_goal";
  dailyCalorieGoal?: number;
  member?: Member;
}

export interface AdminKpi {
  id: string;
  label: string;
  value: string | number;
  change: string;
}

export interface AdminSystemService {
  id?: string;
  name: string;
  status: string;
  uptime: string;
  latency?: string;
  latencyMs?: number;
}

export interface AdminUser {
  id: string;
  memberId: string;
  name: string;
  email: string;
  role: "User" | "Moderator" | "Admin";
  status: string;
  joined: string;
  plan: string;
  initials: string;
  color: string;
  calorieTarget: number;
  aiConversations: number;
  trackedCalories: number;
}

export interface AdminOverview {
  kpis: AdminKpi[];
  systemServices: AdminSystemService[];
  recentUsers: AdminUser[];
  roleBreakdown: Array<{ role: string; count: number }>;
  tierBreakdown: Array<{ tier: string; count: number }>;
  topRecipes: Array<{
    rank: number;
    id: string;
    name: string;
    calories: number;
    tags: string[];
    servings: number;
  }>;
}

export interface AdminUsersResponse {
  total: number;
  count: number;
  filters: {
    search: string;
    role: string;
    status: string;
  };
  roleBreakdown: Array<{ role: string; count: number }>;
  _embedded: {
    users: AdminUser[];
  };
}

export interface AdminContent {
  foods: Food[];
  recipes: Recipe[];
  mealPlans: Array<{
    id: string;
    name: string;
    target: string;
    calories: number;
    meals: number;
    status: string;
  }>;
}

export interface AdminAnalytics {
  dailyMeals: Array<{ day: string; meals: number }>;
  nutritionShare: Array<{ name: string; value: number }>;
  topDishes: Array<{
    rank: number;
    dish: string;
    searches: number;
    calories: number;
    category: string;
  }>;
}

export interface AdminAiSettings {
  model: string;
  autoPortionRecommendation: boolean;
  smartMealSuggestions: boolean;
  nutritionValidation: boolean;
  confidenceThreshold: number;
  calorieFormula: string;
}

export interface AdminSecurity {
  twoFactorEnabled: boolean;
  passwordPolicy: {
    minLength: number;
    requireSpecialChar: boolean;
    requireUppercase: boolean;
    requireNumber: boolean;
  };
  loginActivity: Array<{
    ip: string;
    device: string;
    location: string;
    time: string;
    status: string;
  }>;
}

export interface AdminAiSafetyLog {
  id: string;
  time: string;
  memberId?: string;
  prompt?: string;
  reason?: string;
  ip?: string;
}

export interface CreateFoodPayload {
  name: string;
  category?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

export function login(email: string, password: string) {
  return apiFetch<AuthSession>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function register(payload: RegisterPayload) {
  return apiFetch<AuthSession>("/api/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function getMe() {
  return apiFetch<{ member: Member }>("/api/auth/me");
}

export function logout() {
  return apiFetch<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" });
}

export function getDashboard(date = getLocalDateString()) {
  return apiFetch<DashboardData>(`/api/members/${getCurrentMemberId()}/dashboard?date=${encodeURIComponent(date)}`);
}

export function calculateCalories(payload: CalorieCalculationInput) {
  return apiFetch<CalorieCalculation>("/api/calculations/calorie", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function saveNutritionProfile(payload: CalorieCalculationInput) {
  return apiFetch<{ saved: boolean; member: Member; calculation: CalorieCalculation }>(
    `/api/members/${getCurrentMemberId()}/nutrition-profile`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getMealLog(date: string) {
  return apiFetch<MealLog>(`/api/members/${getCurrentMemberId()}/meal-logs/${encodeURIComponent(date)}`);
}

export function getFoods(search = "") {
  return apiFetch<{ _embedded: { foods: Food[] }; categories: string[] }>(`/api/foods?search=${encodeURIComponent(search)}`);
}

export function addMealItem(date: string, mealId: string, food: string | AddMealItemPayload) {
  return apiFetch<MealLog>(`/api/members/${getCurrentMemberId()}/meal-logs/${encodeURIComponent(date)}/meals/${mealId}/items`, {
    method: "POST",
    body: typeof food === "string" ? { foodId: food } : food,
  });
}

export function estimateFoodPhoto(payload: { imageDataUrl: string; notes?: string }) {
  return apiFetch<{ estimate: FoodPhotoEstimate; addableItem: AddMealItemPayload }>("/api/ai/food-photo-estimate", {
    method: "POST",
    body: payload,
  });
}

export function getCustomFoodIngredients(search = "") {
  return apiFetch<{ _embedded: { ingredients: NutritionIngredient[] }; units: CustomFoodUnit[]; examples: string[] }>(
    `/api/nutrition/custom-food/ingredients?search=${encodeURIComponent(search)}`,
  );
}

export function estimateCustomFood(payload: {
  name: string;
  servings: number;
  cookingMethod?: string;
  rawText?: string;
  ingredients: CustomFoodIngredientInput[];
}) {
  return apiFetch<CustomFoodEstimateResponse>("/api/nutrition/custom-food/estimate", {
    method: "POST",
    body: payload,
  });
}

export function getSavedCustomFoods(search = "") {
  return apiFetch<{ _embedded: { customFoods: SavedCustomFood[] } }>(
    `/api/members/${getCurrentMemberId()}/custom-foods?search=${encodeURIComponent(search)}`,
  );
}

export function saveCustomFoodEstimate(payload: { estimate: CustomFoodEstimate; addableItem: AddMealItemPayload }) {
  return apiFetch<SavedCustomFood>(`/api/members/${getCurrentMemberId()}/custom-foods`, {
    method: "POST",
    body: payload,
  });
}

export function deleteMealItem(date: string, mealId: string, itemId: string) {
  return apiFetch<MealLog>(`/api/members/${getCurrentMemberId()}/meal-logs/${encodeURIComponent(date)}/meals/${mealId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export function updateWater(date: string, waterGlasses: number) {
  return apiFetch<MealLog>(`/api/members/${getCurrentMemberId()}/meal-logs/${encodeURIComponent(date)}/water`, {
    method: "PATCH",
    body: { waterGlasses },
  });
}

export function getRecipes(search = "", tag = "Tất cả") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (tag && tag !== "Tất cả") params.set("tag", tag);
  const query = params.toString();
  return apiFetch<{ _embedded: { recipes: Recipe[] }; tags: string[]; access?: RecipeCollectionMeta["access"] }>(`/api/recipes${query ? `?${query}` : ""}`);
}

export function generatePersonalizedRecipe(payload: { prompt: string; answers?: Record<string, string> }) {
  return apiFetch<PersonalizedRecipeResponse>("/api/ai/personalized-recipes", {
    method: "POST",
    body: payload,
  });
}

export function getPersonalizedRecipes() {
  return apiFetch<{ count: number; _embedded: { recipes: PersonalizedRecipe[] } }>(
    `/api/members/${getCurrentMemberId()}/personalized-recipes`,
  );
}

export function getPlans(billing: "monthly" | "annual") {
  return apiFetch<{ _embedded: { plans: Plan[] } }>(`/api/plans?billing=${billing}`);
}

export function getCheckoutQuote(planId: "vip" | "svip", billing: "monthly" | "annual", discountCode = "") {
  return apiFetch<{ quote: CheckoutQuote }>("/api/checkout/quote", {
    method: "POST",
    body: { planId, billing, discountCode },
  });
}

export function createPayment(payload: PaymentPayload) {
  return apiFetch<{ payment: Payment; member: Member; quote: CheckoutQuote; note: string }>("/api/payments", {
    method: "POST",
    body: payload,
  });
}

export function getFaqs() {
  return apiFetch<{ _embedded: { faqs: Array<{ id: string; question: string; answer: string }> } }>("/api/faqs");
}

export function getProfile() {
  return apiFetch<{ member: Member; plan: Plan | null; benefits: Plan["features"]; billingHistory: Payment[] }>(`/api/members/${getCurrentMemberId()}/profile`);
}

export function updateMemberProfile(payload: Partial<Pick<Member, "name" | "email" | "calorieTarget" | "waterTargetGlasses">>) {
  return apiFetch<Member>(`/api/members/${getCurrentMemberId()}`, {
    method: "PATCH",
    body: payload,
  });
}

export function sendChatMessage(text: string, mode: "assistant" | "coach" = "assistant") {
  const memberId = getStoredSession()?.member.id;
  return apiFetch<ChatResponse>("/api/chat/messages", {
    method: "POST",
    body: memberId ? { memberId, text, mode } : { text, mode },
  });
}

export function getChatHistory() {
  const memberId = getStoredSession()?.member.id;
  const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  return apiFetch<{ messages: ChatMessage[]; quickReplies: string[] }>(`/api/chat/history${query}`);
}

export function getQuickReplies() {
  return apiFetch<{ quickReplies: string[] }>("/api/chat/quick-replies");
}

export function getAdminOverview() {
  return apiFetch<AdminOverview>("/api/admin/overview");
}

export function getAdminUsers(filters: { search?: string; role?: string; status?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.role && filters.role !== "Tất cả") params.set("role", filters.role);
  if (filters.status && filters.status !== "Tất cả") params.set("status", filters.status);
  const query = params.toString();
  return apiFetch<AdminUsersResponse>(`/api/admin/users${query ? `?${query}` : ""}`);
}


export function getAdminContent() {
  return apiFetch<AdminContent>("/api/admin/content");
}

export function getAdminAnalytics() {
  return apiFetch<AdminAnalytics>("/api/admin/analytics");
}

export function getAdminAiSettings() {
  return apiFetch<{ settings: AdminAiSettings }>("/api/admin/settings/ai");
}

export function updateAdminAiSettings(payload: Partial<AdminAiSettings>) {
  return apiFetch<{ settings: AdminAiSettings }>("/api/admin/settings/ai", {
    method: "PATCH",
    body: payload,
  });
}

export function getAdminSecurity() {
  return apiFetch<{ security: AdminSecurity }>("/api/admin/security");
}

export function updateAdminSecurity(payload: Partial<AdminSecurity>) {
  return apiFetch<{ security: AdminSecurity }>("/api/admin/security", {
    method: "PATCH",
    body: payload,
  });
}

export function getAdminAiSafetyLogs() {
  return apiFetch<{ logs: AdminAiSafetyLog[] }>("/api/admin/ai-safety-logs");
}

export function createFood(payload: CreateFoodPayload) {
  return apiFetch<Food>("/api/foods", {
    method: "POST",
    body: payload,
  });
}

export function updateFood(foodId: string, payload: Partial<CreateFoodPayload>) {
  return apiFetch<Food>(`/api/foods/${foodId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteFood(foodId: string) {
  return apiFetch<{ deleted: string }>(`/api/foods/${foodId}`, {
    method: "DELETE",
  });
}
