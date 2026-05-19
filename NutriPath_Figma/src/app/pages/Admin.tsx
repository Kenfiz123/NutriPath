import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import {
  BarChart3,
  BookOpen,
  Bot,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import {
  createFood,
  deleteFood,
  getAdminAiSafetyLogs,
  getAdminAiSettings,
  getAdminAnalytics,
  getAdminContent,
  getAdminOverview,
  getAdminSecurity,
  getAdminUsers,
  updateFood,
  updateAdminAiSettings,
  updateAdminSecurity,
  type AdminAiSafetyLog,
  type AdminAiSettings,
  type AdminAnalytics,
  type AdminContent,
  type AdminOverview,
  type AdminSecurity,
  type AdminUser,
  type CreateFoodPayload,
} from "../api";
import { useAuth } from "../auth";

type AdminTab = "overview" | "users" | "content" | "analytics" | "ai" | "security";

const tabOptions: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "content", label: "Nội dung", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "ai", label: "AI", icon: Bot },
  { id: "security", label: "Bảo mật", icon: Shield },
];

function formatDate(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function statusLabel(status: string) {
  return status === "active" ? "Đang hoạt động" : "Tạm ngưng";
}

function statusClass(status: string) {
  return status === "active"
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-slate-100 text-slate-600 border border-slate-200";
}

function roleClass(role: string) {
  if (role === "Admin") return "bg-violet-50 text-violet-700 border border-violet-200";
  if (role === "Moderator") return "bg-blue-50 text-blue-700 border border-blue-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange(next: boolean): void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-emerald-600" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

function MetricCard({ label, value, change }: { label: string; value: string | number; change: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{change}</p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Admin() {
  const { session, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [content, setContent] = useState<AdminContent | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [aiSettings, setAiSettings] = useState<AdminAiSettings | null>(null);
  const [security, setSecurity] = useState<AdminSecurity | null>(null);
  const [safetyLogs, setSafetyLogs] = useState<AdminAiSafetyLog[]>([]);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const [search, setSearch] = useState("");
  const [savingFood, setSavingFood] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodForm, setFoodForm] = useState<CreateFoodPayload>({
    name: "",
    category: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    portion: "",
  });
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");

  const roleSummary = useMemo(() => overview?.roleBreakdown ?? [], [overview]);
  const tierSummary = useMemo(() => overview?.tierBreakdown ?? [], [overview]);

  async function loadOverview() {
    setLoadingOverview(true);
    try {
      const data = await getAdminOverview();
      setOverview(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được tổng quan admin.");
    } finally {
      setLoadingOverview(false);
    }
  }

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const data = await getAdminUsers({
        search,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(data._embedded.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách người dùng.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadContent() {
    setLoadingContent(true);
    try {
      setContent(await getAdminContent());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được nội dung hệ thống.");
    } finally {
      setLoadingContent(false);
    }
  }

  async function handleCreateFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingFood(true);
    try {
      const payload = {
        ...foodForm,
        name: foodForm.name.trim(),
        category: foodForm.category?.trim() || "Khác",
        portion: foodForm.portion.trim(),
      };
      if (editingFoodId) {
        await updateFood(editingFoodId, payload);
      } else {
        await createFood(payload);
      }
      setFoodForm({
        name: "",
        category: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        portion: "",
      });
      setEditingFoodId(null);
      await loadContent();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : editingFoodId ? "Không cập nhật được món ăn." : "Không thêm được món ăn mới.");
    } finally {
      setSavingFood(false);
    }
  }

  function startEditFood(food: AdminContent["foods"][number]) {
    setEditingFoodId(food.id);
    setFoodForm({
      name: food.name,
      category: food.category || "",
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      portion: food.portion,
    });
  }

  function resetFoodForm() {
    setEditingFoodId(null);
    setFoodForm({
      name: "",
      category: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      portion: "",
    });
  }

  async function handleDeleteFood(foodId: string) {
    if (!window.confirm("Xoa mon an nay khoi he thong?")) return;
    try {
      await deleteFood(foodId);
      if (editingFoodId === foodId) resetFoodForm();
      await loadContent();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được món ăn.");
    }
  }

  async function loadAnalytics() {
    setLoadingAnalytics(true);
    try {
      setAnalytics(await getAdminAnalytics());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được analytics.");
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function loadAi() {
    setLoadingAi(true);
    try {
      const response = await getAdminAiSettings();
      setAiSettings(response.settings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được cài đặt AI.");
    } finally {
      setLoadingAi(false);
    }
  }

  async function loadSecurity() {
    setLoadingSecurity(true);
    try {
      const [securityResponse, logsResponse] = await Promise.all([getAdminSecurity(), getAdminAiSafetyLogs()]);
      setSecurity(securityResponse.security);
      setSafetyLogs(logsResponse.logs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bảo mật hệ thống.");
    } finally {
      setLoadingSecurity(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      void loadUsers();
    }
    if (activeTab === "content" && !content) {
      void loadContent();
    }
    if (activeTab === "analytics" && !analytics) {
      void loadAnalytics();
    }
    if (activeTab === "ai" && !aiSettings) {
      void loadAi();
    }
    if (activeTab === "security" && !security) {
      void loadSecurity();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "users") {
      void loadUsers();
    }
  }, [search, roleFilter, statusFilter]);

  async function refreshCurrentTab() {
    if (activeTab === "overview") await loadOverview();
    if (activeTab === "users") await loadUsers();
    if (activeTab === "content") await loadContent();
    if (activeTab === "analytics") await loadAnalytics();
    if (activeTab === "ai") await loadAi();
    if (activeTab === "security") await loadSecurity();
  }

  async function saveAiSettings() {
    if (!aiSettings) return;
    setSavingAi(true);
    try {
      const response = await updateAdminAiSettings(aiSettings);
      setAiSettings(response.settings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được cài đặt AI.");
    } finally {
      setSavingAi(false);
    }
  }

  async function saveSecurity() {
    if (!security) return;
    setSavingSecurity(true);
    try {
      const response = await updateAdminSecurity(security);
      setSecurity(response.security);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được cấu hình bảo mật.");
    } finally {
      setSavingSecurity(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              <Shield className="h-4 w-4" />
              Admin Dashboard
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Quản trị hệ thống NutriPath</h1>
            <p className="mt-2 text-sm text-slate-500">
              Giữ dữ liệu thật ở tất cả các tab chính: người dùng, nội dung, analytics, AI và bảo mật.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Về dashboard
            </Link>
            <button
              onClick={() => void refreshCurrentTab()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới tab
            </button>
            <button
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {tabOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === id
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {activeTab === "overview" ? (
          loadingOverview ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500">
              Đang tải dữ liệu tổng quan...
            </div>
          ) : overview ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {overview.kpis.map((item) => (
                  <MetricCard key={item.id} label={item.label} value={item.value} change={item.change} />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <SectionCard
                  title="Người dùng mới nhất"
                  subtitle="8 tài khoản gần đây từ dữ liệu member thật"
                  action={(
                    <button
                      onClick={() => setActiveTab("users")}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Mở tab người dùng
                    </button>
                  )}
                >
                  <div className="space-y-3">
                    {overview.recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-700">{user.plan}</p>
                          <p className="text-xs text-slate-500">Tham gia {formatDate(user.joined)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <div className="space-y-6">
                  <SectionCard title="Phân bổ vai trò">
                    <div className="space-y-3">
                      {roleSummary.map((item) => (
                        <div key={item.role}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-slate-600">{item.role}</span>
                            <span className="font-semibold text-slate-900">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${Math.max((item.count / Math.max(...roleSummary.map((role) => role.count), 1)) * 100, 12)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Phân bổ gói">
                    <div className="space-y-3">
                      {tierSummary.map((item) => (
                        <div key={item.tier} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <span className="text-sm font-medium text-slate-600">{item.tier}</span>
                          <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Tình trạng dịch vụ">
                    <div className="space-y-3">
                      {overview.systemServices.map((service) => (
                        <div key={service.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                            <p className="text-xs text-slate-500">Uptime {service.uptime}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-700">{service.status}</p>
                            <p className="text-xs text-slate-500">
                              {service.latency ?? (service.latencyMs !== undefined ? `${service.latencyMs}ms` : "--")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>
            </div>
          ) : null
        ) : null}

        {activeTab === "users" ? (
          <SectionCard
            title="Bảng người dùng"
            subtitle="Lấy trực tiếp từ member thật trong hệ thống"
            action={<div className="text-sm text-slate-500">Admin hiện tại: {session?.member?.email}</div>}
          >
            <div className="mb-5 grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                  placeholder="Tìm theo tên hoặc email"
                />
              </label>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
              >
                {["Tất cả", "User", "Moderator", "Admin"].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
              >
                {["Tất cả", "active", "inactive"].map((option) => (
                  <option key={option} value={option}>
                    {option === "active" ? "Đang hoạt động" : option === "inactive" ? "Tạm ngưng" : option}
                  </option>
                ))}
              </select>
            </div>

            {loadingUsers ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-slate-500">
                Đang tải bảng người dùng...
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{users.length} người dùng khớp bộ lọc hiện tại</span>
                  <span>Dữ liệu thật, không dùng mảng mock</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2">Người dùng</th>
                        <th className="px-3 py-2">Vai trò</th>
                        <th className="px-3 py-2">Gói</th>
                        <th className="px-3 py-2">Mục tiêu calo</th>
                        <th className="px-3 py-2">AI chats</th>
                        <th className="px-3 py-2">Tracked kcal</th>
                        <th className="px-3 py-2">Trạng thái</th>
                        <th className="px-3 py-2">Tham gia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                          <td className="rounded-l-2xl px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: user.color }}
                              >
                                {user.initials}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClass(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{user.plan}</td>
                          <td className="px-3 py-3">{user.calorieTarget} kcal</td>
                          <td className="px-3 py-3">{user.aiConversations}</td>
                          <td className="px-3 py-3">{user.trackedCalories}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(user.status)}`}>
                              {statusLabel(user.status)}
                            </span>
                          </td>
                          <td className="rounded-r-2xl px-3 py-3">{formatDate(user.joined)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SectionCard>
        ) : null}

        {activeTab === "content" ? (
          <div className="space-y-6">
            {loadingContent ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500">
                Đang tải nội dung...
              </div>
            ) : content ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard label="Foods" value={content.foods.length} change="Nguồn dữ liệu hiện có" />
                  <MetricCard label="Recipes" value={content.recipes.length} change="Công thức đang publish" />
                  <MetricCard label="Meal plans" value={content.mealPlans.length} change="Kế hoạch/quyền lợi gói" />
                </div>

                <SectionCard
                  title={editingFoodId ? "Sua mon an" : "Them mon an"}
                  subtitle={editingFoodId ? "Dang chinh sua food da chon" : "Admin co the tao food moi ngay trong dashboard"}
                >
                  <form onSubmit={(event) => void handleCreateFood(event)} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Ten mon</span>
                      <input
                        required
                        value={foodForm.name}
                        onChange={(event) => setFoodForm({ ...foodForm, name: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                        placeholder="Uc ga ap chao"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Danh muc</span>
                      <input
                        value={foodForm.category || ""}
                        onChange={(event) => setFoodForm({ ...foodForm, category: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                        placeholder="Protein"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Khau phan</span>
                      <input
                        required
                        value={foodForm.portion}
                        onChange={(event) => setFoodForm({ ...foodForm, portion: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                        placeholder="100g / 1 bat / 1 ly"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:col-span-4">
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Calories</span>
                        <input
                          required
                          type="number"
                          min={0}
                          value={foodForm.calories}
                          onChange={(event) => setFoodForm({ ...foodForm, calories: Number(event.target.value) || 0 })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Protein</span>
                        <input
                          required
                          type="number"
                          min={0}
                          step="0.1"
                          value={foodForm.protein}
                          onChange={(event) => setFoodForm({ ...foodForm, protein: Number(event.target.value) || 0 })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Carbs</span>
                        <input
                          required
                          type="number"
                          min={0}
                          step="0.1"
                          value={foodForm.carbs}
                          onChange={(event) => setFoodForm({ ...foodForm, carbs: Number(event.target.value) || 0 })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Fat</span>
                        <input
                          required
                          type="number"
                          min={0}
                          step="0.1"
                          value={foodForm.fat}
                          onChange={(event) => setFoodForm({ ...foodForm, fat: Number(event.target.value) || 0 })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                        />
                      </label>
                    </div>

                    <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-3">
                      {editingFoodId ? (
                        <button
                          type="button"
                          onClick={resetFoodForm}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Huy sua
                        </button>
                      ) : null}
                      <button
                        type="submit"
                        disabled={savingFood}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {savingFood ? (editingFoodId ? "Dang luu..." : "Dang them...") : (editingFoodId ? "Luu mon an" : "Them mon an")}
                      </button>
                    </div>
                  </form>
                </SectionCard>

                <div className="grid gap-6 xl:grid-cols-2">
                  <SectionCard title="Foods" subtitle="10 thực phẩm đầu tiên từ database">
                    <div className="space-y-3">
                      {[...content.foods].slice(-10).reverse().map((food) => (
                        <div key={food.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                          <div>
                            <p className="font-semibold text-slate-900">{food.name}</p>
                            <p className="text-xs text-slate-500">{food.category ?? "Khác"} • {food.portion}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right text-sm">
                              <p className="font-semibold text-slate-900">{food.calories} kcal</p>
                              <p className="text-slate-500">P {food.protein} ? C {food.carbs} ? F {food.fat}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditFood(food)}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                              >
                                Sua
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteFood(food.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                              >
                                Xoa
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Recipes" subtitle="10 công thức đầu tiên từ hệ thống">
                    <div className="space-y-3">
                      {content.recipes.slice(0, 10).map((recipe) => (
                        <div key={recipe.id} className="rounded-xl bg-slate-50 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{recipe.name}</p>
                              <p className="text-xs text-slate-500">{recipe.timeMinutes} phút • {recipe.servings} khẩu phần</p>
                            </div>
                            <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">{recipe.calories} kcal</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {recipe.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">{tag}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <SectionCard title="Meal plans / quyền lợi gói" subtitle="Đang lấy từ plans thực tế của hệ thống">
                  <div className="grid gap-4 md:grid-cols-3">
                    {content.mealPlans.map((plan) => (
                      <div key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                          <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">{plan.status}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{plan.target}</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-white px-3 py-2">
                            <p className="text-slate-500">Giá/tháng</p>
                            <p className="font-semibold text-slate-900">{plan.calories}</p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2">
                            <p className="text-slate-500">Tính năng</p>
                            <p className="font-semibold text-slate-900">{plan.meals}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </>
            ) : null}
          </div>
        ) : null}

        {activeTab === "analytics" ? (
          loadingAnalytics ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500">
              Đang tải analytics...
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              <SectionCard title="Meal activity 7 ngày" subtitle="Tổng số món được ghi nhận mỗi ngày">
                <div className="grid grid-cols-7 gap-3">
                  {analytics.dailyMeals.map((entry) => {
                    const max = Math.max(...analytics.dailyMeals.map((item) => item.meals), 1);
                    const pct = Math.max((entry.meals / max) * 100, 8);
                    return (
                      <div key={entry.day} className="rounded-2xl bg-slate-50 p-3 text-center">
                        <div className="mx-auto mb-3 flex h-36 items-end justify-center">
                          <div className="w-10 rounded-t-xl bg-emerald-500" style={{ height: `${pct}%` }} />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{entry.day}</p>
                        <p className="text-xs text-slate-500">{entry.meals} món</p>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <SectionCard title="Tỷ lệ macro" subtitle="Tổng hợp từ meal log thực tế">
                  <div className="space-y-4">
                    {analytics.nutritionShare.map((item) => (
                      <div key={item.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-slate-600">{item.name}</span>
                          <span className="font-semibold text-slate-900">{item.value}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div className="h-3 rounded-full bg-blue-500" style={{ width: `${Math.max(item.value, 6)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Top món được ghi nhận" subtitle="Sắp xếp theo số lần xuất hiện trong meal log">
                  <div className="space-y-3">
                    {analytics.topDishes.map((dish) => (
                      <div key={`${dish.rank}-${dish.dish}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">#{dish.rank} {dish.dish}</p>
                          <p className="text-xs text-slate-500">{dish.category} • {dish.calories} kcal</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{dish.searches}</p>
                          <p className="text-xs text-slate-500">lần ghi nhận</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          ) : null
        ) : null}

        {activeTab === "ai" ? (
          loadingAi ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500">
              Đang tải cài đặt AI...
            </div>
          ) : aiSettings ? (
            <div className="space-y-6">
              <SectionCard
                title="Cài đặt AI"
                subtitle="Đang lưu vào backend settings hiện tại"
                action={(
                  <button
                    onClick={() => void saveAiSettings()}
                    disabled={savingAi}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingAi ? "Đang lưu..." : "Lưu cài đặt AI"}
                  </button>
                )}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Model</span>
                    <input
                      value={aiSettings.model}
                      onChange={(event) => setAiSettings({ ...aiSettings, model: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Confidence threshold</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={aiSettings.confidenceThreshold}
                      onChange={(event) => setAiSettings({ ...aiSettings, confidenceThreshold: Number(event.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Calorie formula</span>
                    <input
                      value={aiSettings.calorieFormula}
                      onChange={(event) => setAiSettings({ ...aiSettings, calorieFormula: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                    />
                  </label>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-slate-900">Auto portion</p>
                      <Toggle
                        checked={aiSettings.autoPortionRecommendation}
                        onChange={(next) => setAiSettings({ ...aiSettings, autoPortionRecommendation: next })}
                      />
                    </div>
                    <p className="text-sm text-slate-500">Tự động gợi ý khẩu phần.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-slate-900">Smart meal suggestions</p>
                      <Toggle
                        checked={aiSettings.smartMealSuggestions}
                        onChange={(next) => setAiSettings({ ...aiSettings, smartMealSuggestions: next })}
                      />
                    </div>
                    <p className="text-sm text-slate-500">Bật gợi ý bữa ăn thông minh.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-slate-900">Nutrition validation</p>
                      <Toggle
                        checked={aiSettings.nutritionValidation}
                        onChange={(next) => setAiSettings({ ...aiSettings, nutritionValidation: next })}
                      />
                    </div>
                    <p className="text-sm text-slate-500">Kiểm tra chéo logic dinh dưỡng.</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null
        ) : null}

        {activeTab === "security" ? (
          loadingSecurity ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500">
              Đang tải cấu hình bảo mật...
            </div>
          ) : security ? (
            <div className="space-y-6">
              <SectionCard
                title="Cài đặt bảo mật"
                subtitle="Quản lý policy và theo dõi hoạt động đăng nhập"
                action={(
                  <button
                    onClick={() => void saveSecurity()}
                    disabled={savingSecurity}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingSecurity ? "Đang lưu..." : "Lưu bảo mật"}
                  </button>
                )}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-slate-900">Two-factor authentication</p>
                      <Toggle
                        checked={security.twoFactorEnabled}
                        onChange={(next) => setSecurity({ ...security, twoFactorEnabled: next })}
                      />
                    </div>
                    <p className="text-sm text-slate-500">Bật/tắt xác thực hai lớp cho admin flow.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="mb-3 font-semibold text-slate-900">Password policy</p>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                        Độ dài tối thiểu
                        <input
                          type="number"
                          min={6}
                          value={security.passwordPolicy.minLength}
                          onChange={(event) => setSecurity({
                            ...security,
                            passwordPolicy: {
                              ...security.passwordPolicy,
                              minLength: Number(event.target.value) || 8,
                            },
                          })}
                          className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                        Ký tự đặc biệt
                        <Toggle
                          checked={security.passwordPolicy.requireSpecialChar}
                          onChange={(next) => setSecurity({
                            ...security,
                            passwordPolicy: { ...security.passwordPolicy, requireSpecialChar: next },
                          })}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                        Chữ hoa
                        <Toggle
                          checked={security.passwordPolicy.requireUppercase}
                          onChange={(next) => setSecurity({
                            ...security,
                            passwordPolicy: { ...security.passwordPolicy, requireUppercase: next },
                          })}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                        Chữ số
                        <Toggle
                          checked={security.passwordPolicy.requireNumber}
                          onChange={(next) => setSecurity({
                            ...security,
                            passwordPolicy: { ...security.passwordPolicy, requireNumber: next },
                          })}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard title="Login activity" subtitle="Lấy từ security settings hiện tại">
                  <div className="space-y-3">
                    {security.loginActivity.map((item, index) => (
                      <div key={`${item.ip}-${index}`} className="flex items-start justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.ip}</p>
                          <p className="text-xs text-slate-500">{item.device} • {item.location}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${item.status === "success" ? "text-emerald-700" : "text-red-600"}`}>
                            {item.status}
                          </p>
                          <p className="text-xs text-slate-500">{formatDateTime(item.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="AI safety logs" subtitle="Nhật ký prompt nguy hiểm để admin kiểm tra">
                  <div className="space-y-3">
                    {safetyLogs.length ? safetyLogs.map((log) => (
                      <div key={log.id} className="rounded-xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{log.reason || "Blocked prompt"}</p>
                          <span className="text-xs text-slate-500">{formatDateTime(log.time)}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{log.prompt || "Không có prompt."}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          member: {log.memberId || "--"} • ip: {log.ip || "--"}
                        </p>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                        Chưa có safety log nào.
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          ) : null
        ) : null}
      </div>
    </div>
  );
}
