const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080";
const SESSION_KEY = "nutripath_session";

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
  tier: "free" | "vip" | "svip";
  joinedAt: string;
  calorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fat: number;
  };
  waterTargetGlasses: number;
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
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
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

export function getDashboard(date = "2026-03-13") {
  return apiFetch<DashboardData>(`/api/members/${getCurrentMemberId()}/dashboard?date=${encodeURIComponent(date)}`);
}

export function getMealLog(date: string) {
  return apiFetch<MealLog>(`/api/members/${getCurrentMemberId()}/meal-logs/${encodeURIComponent(date)}`);
}

export function getFoods(search = "") {
  return apiFetch<{ _embedded: { foods: Food[] }; categories: string[] }>(`/api/foods?search=${encodeURIComponent(search)}`);
}

export function addMealItem(date: string, mealId: string, foodId: string) {
  return apiFetch<MealLog>(`/api/members/${getCurrentMemberId()}/meal-logs/${encodeURIComponent(date)}/meals/${mealId}/items`, {
    method: "POST",
    body: { foodId },
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
  return apiFetch<{ _embedded: { recipes: Recipe[] }; tags: string[] }>(`/api/recipes${query ? `?${query}` : ""}`);
}

export function getPlans(billing: "monthly" | "annual") {
  return apiFetch<{ _embedded: { plans: Plan[] } }>(`/api/plans?billing=${billing}`);
}

export function getFaqs() {
  return apiFetch<{ _embedded: { faqs: Array<{ id: string; question: string; answer: string }> } }>("/api/faqs");
}

export function getProfile() {
  return apiFetch<{ member: Member; plan: Plan | null; benefits: Plan["features"]; billingHistory: Payment[] }>(`/api/members/${getCurrentMemberId()}/profile`);
}

export function sendChatMessage(text: string) {
  const memberId = getStoredSession()?.member.id;
  return apiFetch<{ messages: Array<{ id: string; sender: "user" | "ai"; text: string; time: string }>; quickReplies: string[] }>("/api/chat/messages", {
    method: "POST",
    body: memberId ? { memberId, text } : { text },
  });
}

export function getQuickReplies() {
  return apiFetch<{ quickReplies: string[] }>("/api/chat/quick-replies");
}
