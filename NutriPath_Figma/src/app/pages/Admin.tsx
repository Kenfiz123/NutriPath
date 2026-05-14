import { useState } from "react";
import { Link } from "react-router";
import {
  Users, LayoutDashboard, FileText, BarChart2, Bot, Shield, ChevronRight,
  TrendingUp, TrendingDown, Activity, Server, Zap, AlertCircle, Check, Settings,
  Leaf, Moon, Sun, LogOut, Bell, Search, MoreVertical, Eye, Trash2, Edit3,
  Plus, Filter, Download, ChevronLeft, ChevronDown, UploadCloud, Globe,
  Utensils, BookOpen, Coffee, Sliders, ToggleLeft, ToggleRight, Save,
  Lock, Smartphone, Monitor, MapPin, Clock, XCircle, RefreshCw, Calendar,
  UserPlus, Database, PieChart as PieChartIcon, TrendingUp as LineChartIcon,
  AlertTriangle, CheckCircle, Info
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area
} from "recharts";

/* ─────────────── MOCK DATA ─────────────── */

const dauData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  users: Math.floor(Math.random() * 600 + 800),
  newUsers: Math.floor(Math.random() * 120 + 60),
}));

const topRecipes = [
  { rank: 1, name: "Phở Bò Tái Chín Truyền Thống", searches: 18420, trend: "up", change: "+12%" },
  { rank: 2, name: "Cơm Tấm Sườn Nướng Bì Chả", searches: 15300, trend: "up", change: "+8%" },
  { rank: 3, name: "Bún Chả Hà Nội Chính Gốc", searches: 12800, trend: "up", change: "+15%" },
  { rank: 4, name: "Cháo Gà Gừng Hành", searches: 9600, trend: "down", change: "-3%" },
  { rank: 5, name: "Gỏi Cuốn Tôm Thịt", searches: 8900, trend: "up", change: "+6%" },
  { rank: 6, name: "Canh Chua Cá Lóc Miền Nam", searches: 7650, trend: "up", change: "+4%" },
  { rank: 7, name: "Rau Muống Xào Tỏi", searches: 6200, trend: "down", change: "-1%" },
];

const chatbotStats = [
  { label: "Tổng tin nhắn", value: "94.2K", change: "+18%", up: true },
  { label: "Phiên chat/ngày", value: "3,840", change: "+9%", up: true },
  { label: "Thời gian phản hồi", value: "1.2s", change: "-0.3s", up: true },
  { label: "Tỉ lệ hài lòng", value: "94%", change: "+2%", up: true },
];

const systemServices = [
  { name: "API Server", status: "online", uptime: "99.9%", latency: "42ms" },
  { name: "Database", status: "online", uptime: "99.7%", latency: "18ms" },
  { name: "AI Service", status: "online", uptime: "99.5%", latency: "210ms" },
  { name: "CDN", status: "online", uptime: "100%", latency: "8ms" },
];

const recentUsers = [
  { id: "U001", name: "Nguyễn Thị Mai", email: "mai.nt@example.com", joined: "10/03/2026", status: "active", plan: "Free" },
  { id: "U002", name: "Trần Minh Quân", email: "quan.tm@example.com", joined: "09/03/2026", status: "active", plan: "Pro" },
  { id: "U003", name: "Lê Thị Hoa", email: "hoa.lt@example.com", joined: "08/03/2026", status: "inactive", plan: "Free" },
  { id: "U004", name: "Phạm Văn An", email: "an.pv@example.com", joined: "07/03/2026", status: "active", plan: "Pro" },
  { id: "U005", name: "Hoàng Minh Tuấn", email: "tuan.hm@example.com", joined: "06/03/2026", status: "active", plan: "Free" },
];

// USER MANAGEMENT DATA
const allUsers = [
  { id: "U001", name: "Nguyễn Thị Mai", email: "mai.nt@example.com", role: "User", status: "active", joined: "10/03/2026", initials: "NM", color: "#16a34a" },
  { id: "U002", name: "Trần Minh Quân", email: "quan.tm@example.com", role: "Admin", status: "active", joined: "09/03/2026", initials: "TQ", color: "#3b82f6" },
  { id: "U003", name: "Lê Thị Hoa", email: "hoa.lt@example.com", role: "User", status: "inactive", joined: "08/03/2026", initials: "LH", color: "#f59e0b" },
  { id: "U004", name: "Phạm Văn An", email: "an.pv@example.com", role: "Moderator", status: "active", joined: "07/03/2026", initials: "PA", color: "#8b5cf6" },
  { id: "U005", name: "Hoàng Minh Tuấn", email: "tuan.hm@example.com", role: "User", status: "active", joined: "06/03/2026", initials: "HT", color: "#ec4899" },
  { id: "U006", name: "Vũ Thu Hương", email: "huong.vt@example.com", role: "User", status: "inactive", joined: "05/03/2026", initials: "VH", color: "#14b8a6" },
  { id: "U007", name: "Đặng Quốc Bảo", email: "bao.dq@example.com", role: "Moderator", status: "active", joined: "04/03/2026", initials: "DB", color: "#f97316" },
  { id: "U008", name: "Bùi Thị Lan", email: "lan.bt@example.com", role: "User", status: "active", joined: "03/03/2026", initials: "BL", color: "#6366f1" },
  { id: "U009", name: "Ngô Văn Hùng", email: "hung.nv@example.com", role: "User", status: "active", joined: "02/03/2026", initials: "NH", color: "#84cc16" },
  { id: "U010", name: "Cao Thị Yến", email: "yen.ct@example.com", role: "Admin", status: "active", joined: "01/03/2026", initials: "CY", color: "#06b6d4" },
];

// CONTENT MANAGEMENT DATA
const foodDatabase = [
  { id: 1, name: "Phở Bò", category: "Súp & Cháo", calories: 420, protein: 28, fat: 12, carbs: 48 },
  { id: 2, name: "Cơm Tấm Sườn", category: "Cơm", calories: 650, protein: 32, fat: 22, carbs: 75 },
  { id: 3, name: "Bún Chả", category: "Bún", calories: 380, protein: 24, fat: 14, carbs: 42 },
  { id: 4, name: "Gỏi Cuốn Tôm", category: "Gỏi & Salad", calories: 180, protein: 12, fat: 4, carbs: 24 },
  { id: 5, name: "Bánh Mì Thịt", category: "Bánh mì", calories: 520, protein: 26, fat: 18, carbs: 62 },
  { id: 6, name: "Canh Chua Cá", category: "Canh", calories: 240, protein: 18, fat: 8, carbs: 22 },
  { id: 7, name: "Bún Bò Huế", category: "Bún", calories: 460, protein: 30, fat: 16, carbs: 50 },
  { id: 8, name: "Cháo Gà Gừng", category: "Súp & Cháo", calories: 280, protein: 22, fat: 7, carbs: 32 },
  { id: 9, name: "Rau Muống Xào Tỏi", category: "Rau củ", calories: 120, protein: 4, fat: 6, carbs: 14 },
  { id: 10, name: "Chả Giò Chiên", category: "Khai vị", calories: 320, protein: 14, fat: 18, carbs: 28 },
];

const mealPlans = [
  { id: 1, name: "Kế hoạch giảm cân 7 ngày", target: "Giảm cân", calories: 1500, meals: 21, status: "active" },
  { id: 2, name: "Tăng cơ cho nam giới", target: "Tăng cơ", calories: 2800, meals: 28, status: "active" },
  { id: 3, name: "Ăn chay thuần Việt", target: "Sức khỏe", calories: 1800, meals: 21, status: "draft" },
  { id: 4, name: "Detox 3 ngày", target: "Thanh lọc", calories: 1200, meals: 9, status: "active" },
  { id: 5, name: "Dinh dưỡng cho mẹ bầu", target: "Thai kỳ", calories: 2200, meals: 21, status: "active" },
];

const articles = [
  { id: 1, title: "10 Thực phẩm giàu protein cho người Việt", author: "BS. Nguyễn Văn A", category: "Dinh dưỡng", views: 12400, status: "published" },
  { id: 2, title: "Cách tính calo trong ẩm thực Việt", author: "TS. Lê Thị B", category: "Hướng dẫn", views: 9800, status: "published" },
  { id: 3, title: "Phương pháp ăn kiêng lành mạnh mùa hè", author: "Chuyên gia C", category: "Ăn kiêng", views: 7200, status: "draft" },
  { id: 4, title: "Vitamin và khoáng chất trong rau củ Việt", author: "TS. Trần D", category: "Dinh dưỡng", views: 5600, status: "published" },
  { id: 5, title: "Bí quyết nấu ăn lành mạnh mà ngon", author: "Đầu bếp E", category: "Công thức", views: 4300, status: "review" },
];

// ANALYTICS DATA
const dailyMealsData = [
  { day: "T2", meals: 3240 }, { day: "T3", meals: 2980 }, { day: "T4", meals: 3560 },
  { day: "T5", meals: 4120 }, { day: "T6", meals: 4800 }, { day: "T7", meals: 5200 }, { day: "CN", meals: 4650 },
];

const nutritionPieData = [
  { name: "Carbs", value: 45, color: "#f59e0b" },
  { name: "Protein", value: 30, color: "#16a34a" },
  { name: "Chất béo", value: 25, color: "#3b82f6" },
];

const userGrowthData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  users: Math.floor(1200 + i * 80 + Math.random() * 200),
}));

const top10Dishes = [
  { rank: 1, dish: "Phở Bò Tái Chín", searches: 18420, calories: 420, category: "Súp", trend: "up" },
  { rank: 2, dish: "Cơm Tấm Sườn", searches: 15300, calories: 650, category: "Cơm", trend: "up" },
  { rank: 3, dish: "Bún Chả Hà Nội", searches: 12800, calories: 380, category: "Bún", trend: "up" },
  { rank: 4, dish: "Bánh Mì Thịt Nướng", searches: 10900, calories: 520, category: "Bánh mì", trend: "up" },
  { rank: 5, dish: "Cháo Gà Gừng", searches: 9600, calories: 280, category: "Cháo", trend: "down" },
  { rank: 6, dish: "Gỏi Cuốn Tôm Thịt", searches: 8900, calories: 180, category: "Gỏi", trend: "up" },
  { rank: 7, dish: "Canh Chua Cá Lóc", searches: 7650, calories: 240, category: "Canh", trend: "up" },
  { rank: 8, dish: "Hủ Tiếu Nam Vang", searches: 7100, calories: 450, category: "Bún", trend: "down" },
  { rank: 9, dish: "Bún Bò Huế", searches: 6840, calories: 460, category: "Bún", trend: "up" },
  { rank: 10, dish: "Rau Muống Xào Tỏi", searches: 6200, calories: 120, category: "Rau củ", trend: "down" },
];

// LOGIN ACTIVITY DATA
const loginActivity = [
  { ip: "192.168.1.105", device: "Chrome / macOS", location: "Hà Nội, VN", time: "14/03/2026 09:42", status: "success" },
  { ip: "10.0.0.52", device: "Firefox / Windows", location: "TP.HCM, VN", time: "14/03/2026 08:15", status: "success" },
  { ip: "45.76.102.8", device: "Safari / iOS", location: "Đà Nẵng, VN", time: "13/03/2026 22:30", status: "failed" },
  { ip: "172.16.0.9", device: "Chrome / Android", location: "Cần Thơ, VN", time: "13/03/2026 18:50", status: "success" },
  { ip: "203.113.4.22", device: "Edge / Windows", location: "Hải Phòng, VN", time: "13/03/2026 14:20", status: "failed" },
  { ip: "192.168.2.18", device: "Chrome / macOS", location: "Hà Nội, VN", time: "12/03/2026 11:05", status: "success" },
  { ip: "37.44.197.5", device: "Unknown / Unknown", location: "Singapore", time: "12/03/2026 03:17", status: "failed" },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Người dùng", icon: Users, id: "users" },
  { label: "Quản lý nội dung", icon: FileText, id: "content" },
  { label: "Phân tích", icon: BarChart2, id: "analytics" },
  { label: "Cài đặt AI", icon: Bot, id: "ai" },
  { label: "Bảo mật", icon: Shield, id: "security" },
];

/* ─────────────── COMPONENT ─────────────── */

export function Admin() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);

  // User management states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("Tất cả");
  const [userStatusFilter, setUserStatusFilter] = useState("Tất cả");

  // Content management states
  const [contentTab, setContentTab] = useState("food");
  const [foodSearch, setFoodSearch] = useState("");

  // Analytics states
  const [analyticsRange, setAnalyticsRange] = useState("7 ngày qua");

  // AI Settings states
  const [aiModel, setAiModel] = useState("Gemini 1.5 Pro");
  const [autoPortionRec, setAutoPortionRec] = useState(true);
  const [smartMealSuggestions, setSmartMealSuggestions] = useState(true);
  const [nutritionValidation, setNutritionValidation] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [calorieFormula, setCalorieFormula] = useState("(10 × W) + (6.25 × H) - (5 × A) + 5");
  const [aiSaved, setAiSaved] = useState(false);

  // Security states
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [minPassword, setMinPassword] = useState(true);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [requireUppercase, setRequireUppercase] = useState(false);
  const [requireNumber, setRequireNumber] = useState(true);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const bg = "#0f172a";
  const cardBg = "#1e293b";
  const sidebarBg = "#0f172a";
  const textPrimary = "#f1f5f9";
  const textSecondary = "#94a3b8";
  const borderColor = "#334155";
  const hoverBg = "#334155";
  const inputBg = "#0f172a";

  /* ── Helpers ── */
  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="relative inline-flex items-center rounded-full transition-colors duration-200 flex-shrink-0"
      style={{
        width: "44px", height: "24px",
        backgroundColor: enabled ? "#16a34a" : "#334155",
      }}
    >
      <span
        className="inline-block rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: "18px", height: "18px",
          transform: enabled ? "translateX(22px)" : "translateX(3px)",
        }}
      />
    </button>
  );

  const pageTitle: Record<string, string> = {
    dashboard: "Admin Dashboard",
    users: "Quản lý người dùng",
    content: "Quản lý nội dung",
    analytics: "Phân tích & Báo cáo",
    ai: "Cài đặt AI",
    security: "Bảo mật",
  };

  /* ─── DASHBOARD SECTION ─── */
  const renderDashboard = () => (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: "Tổng người dùng", value: "48,291", change: "+12%", up: true, icon: Users, color: "#16a34a" },
          { label: "DAU hôm nay", value: "3,840", change: "+7%", up: true, icon: Activity, color: "#3b82f6" },
          { label: "Tin nhắn AI/ngày", value: "94.2K", change: "+18%", up: true, icon: Bot, color: "#8b5cf6" },
          { label: "Tỉ lệ giữ chân", value: "68.4%", change: "+2%", up: true, icon: TrendingUp, color: "#f59e0b" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${kpi.color}20` }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span className="flex items-center gap-1" style={{ backgroundColor: kpi.up ? "#16a34a20" : "#ef444420", color: kpi.up ? "#22c55e" : "#ef4444", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "999px" }}>
                {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p style={{ fontSize: "1.8rem", fontWeight: 800, color: textPrimary }}>{kpi.value}</p>
            <p style={{ fontSize: "0.8rem", color: textSecondary, marginTop: "4px" }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="col-span-2 rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>Người dùng hoạt động (30 ngày)</h3>
              <p style={{ fontSize: "0.8rem", color: textSecondary }}>Daily Active Users</p>
            </div>
            <div className="flex gap-2">
              {["7d", "30d", "90d"].map((p) => (
                <button key={p} className="px-3 py-1 rounded-lg text-xs transition-colors" style={{ backgroundColor: p === "30d" ? "#16a34a" : "#334155", color: p === "30d" ? "#fff" : textSecondary, fontSize: "0.75rem" }}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dauData}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: textSecondary }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: textSecondary }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: "12px", fontSize: "0.75rem", color: textPrimary }} />
              <Area type="monotone" dataKey="users" stroke="#16a34a" strokeWidth={2.5} fill="url(#dauGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <h3 className="mb-4" style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>Tỉ lệ giữ chân</h3>
          <div className="flex justify-center">
            <div className="relative" style={{ width: "160px", height: "160px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ value: 68 }, { value: 32 }]} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={75} dataKey="value" paddingAngle={2}>
                    <Cell fill="#16a34a" />
                    <Cell fill="#334155" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: "20px" }}>
                <span style={{ fontSize: "1.6rem", fontWeight: 800, color: textPrimary }}>68%</span>
                <span style={{ fontSize: "0.7rem", color: textSecondary }}>Retention</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[{ label: "7 ngày", value: "82%", pct: 82, color: "#16a34a" }, { label: "30 ngày", value: "68%", pct: 68, color: "#3b82f6" }, { label: "90 ngày", value: "54%", pct: 54, color: "#f59e0b" }].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span style={{ fontSize: "0.8rem", color: textSecondary }}>{r.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 rounded-full h-1.5" style={{ backgroundColor: "#334155" }}>
                    <div className="h-1.5 rounded-full" style={{ width: r.value, backgroundColor: r.color }}></div>
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: textPrimary }}>{r.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        <div className="col-span-5 rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>Công thức tìm kiếm nhiều nhất</h3>
            <button className="text-green-500 hover:text-green-400 transition-colors" style={{ fontSize: "0.8rem" }}>Xem tất cả</button>
          </div>
          <div className="space-y-2">
            {topRecipes.map((recipe) => (
              <div key={recipe.rank} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: "#0f172a" }}>
                <span className="w-6 text-center" style={{ fontSize: "0.8rem", fontWeight: 700, color: recipe.rank <= 3 ? "#f59e0b" : textSecondary }}>{recipe.rank}</span>
                <span className="flex-1 truncate" style={{ fontSize: "0.8rem", color: textPrimary }}>{recipe.name}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: textSecondary }}>{recipe.searches.toLocaleString()}</span>
                <span className="flex items-center gap-0.5" style={{ fontSize: "0.75rem", color: recipe.trend === "up" ? "#22c55e" : "#ef4444" }}>
                  {recipe.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {recipe.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <h3 className="mb-5" style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>AI Chatbot</h3>
          <div className="grid grid-cols-2 gap-3">
            {chatbotStats.map((stat) => (
              <div key={stat.label} className="rounded-xl p-3" style={{ backgroundColor: "#0f172a" }}>
                <p style={{ fontSize: "1.2rem", fontWeight: 800, color: textPrimary }}>{stat.value}</p>
                <p style={{ fontSize: "0.7rem", color: textSecondary, marginTop: "2px" }}>{stat.label}</p>
                <span style={{ fontSize: "0.7rem", color: "#22c55e" }}>{stat.change}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p style={{ fontSize: "0.8rem", color: textSecondary, marginBottom: "8px" }}>Phân loại câu hỏi</p>
            {[{ label: "Dinh dưỡng", pct: 45 }, { label: "Công thức", pct: 30 }, { label: "Tính calo", pct: 25 }].map((item) => (
              <div key={item.label} className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: "0.72rem", color: textSecondary, width: "65px" }}>{item.label}</span>
                <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: "#334155" }}>
                  <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${item.pct}%` }}></div>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: textPrimary }}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-4 rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>Trạng thái hệ thống</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span style={{ fontSize: "0.75rem", color: "#22c55e" }}>Tất cả online</span>
            </div>
          </div>
          <div className="space-y-3">
            {systemServices.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "#0f172a" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: textPrimary }}>{service.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "0.75rem", color: "#22c55e" }}>{service.uptime}</span>
                  <span style={{ fontSize: "0.75rem", color: textSecondary }}>{service.latency}</span>
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl border" style={{ borderColor: "#16a34a30", backgroundColor: "#16a34a10" }}>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-green-500" />
              <span style={{ fontSize: "0.8rem", color: "#22c55e", fontWeight: 600 }}>99.9% uptime tháng này</span>
            </div>
            <p style={{ fontSize: "0.72rem", color: textSecondary, marginTop: "4px" }}>Không có sự cố trong 30 ngày qua</p>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>Người dùng mới gần đây</h3>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 rounded-xl border transition-colors" style={{ fontSize: "0.8rem", color: textSecondary, borderColor, backgroundColor: "#334155" }}>Xuất CSV</button>
            <button className="px-3 py-1.5 rounded-xl bg-green-600 text-white transition-colors" style={{ fontSize: "0.8rem" }}>Xem tất cả</button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#0f172a" }}>
              {["ID", "Tên", "Email", "Ngày tham gia", "Gói", "Trạng thái", "Hành động"].map((h) => (
                <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: textSecondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user) => (
              <tr key={user.id} className="border-t" style={{ borderColor }}>
                <td className="px-5 py-3"><span style={{ fontSize: "0.8rem", color: textSecondary, fontFamily: "monospace" }}>{user.id}</span></td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400" style={{ fontSize: "0.7rem", fontWeight: 700 }}>{user.name.split(" ").slice(-1)[0][0]}</span>
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3"><span style={{ fontSize: "0.8rem", color: textSecondary }}>{user.email}</span></td>
                <td className="px-5 py-3"><span style={{ fontSize: "0.8rem", color: textSecondary }}>{user.joined}</span></td>
                <td className="px-5 py-3">
                  <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: user.plan === "Pro" ? "#f59e0b20" : "#64748b20", color: user.plan === "Pro" ? "#f59e0b" : textSecondary }}>{user.plan}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: user.status === "active" ? "#16a34a20" : "#ef444420", color: user.status === "active" ? "#22c55e" : "#ef4444" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.status === "active" ? "#22c55e" : "#ef4444" }}></span>
                    {user.status === "active" ? "Hoạt động" : "Không HĐ"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"><Eye className="w-3.5 h-3.5 text-blue-400" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors"><Edit3 className="w-3.5 h-3.5 text-yellow-400" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ─── USER MANAGEMENT SECTION ─── */
  const renderUsers = () => {
    const filtered = allUsers.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === "Tất cả" || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === "Tất cả" || (userStatusFilter === "Hoạt động" ? u.status === "active" : u.status === "inactive");
      return matchSearch && matchRole && matchStatus;
    });

    return (
      <>
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-5 mb-6">
          {[
            { label: "Tổng người dùng", value: "48,291", icon: Users, color: "#16a34a" },
            { label: "Đang hoạt động", value: "38,420", icon: Activity, color: "#3b82f6" },
            { label: "Admins", value: "12", icon: Shield, color: "#8b5cf6" },
            { label: "Mới hôm nay", value: "+247", icon: UserPlus, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 border flex items-center gap-4" style={{ backgroundColor: cardBg, borderColor }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}20` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, color: textPrimary }}>{s.value}</p>
                <p style={{ fontSize: "0.75rem", color: textSecondary }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b gap-4" style={{ borderColor }}>
            <div className="flex items-center gap-3 flex-1">
              {/* Search */}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-xs" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: textSecondary }} />
                <input
                  placeholder="Tìm theo tên hoặc email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent outline-none flex-1"
                  style={{ fontSize: "0.85rem", color: textPrimary }}
                />
              </div>
              {/* Role filter */}
              <div className="relative">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-xl px-3 py-2 pr-8 outline-none appearance-none cursor-pointer"
                  style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textPrimary, fontSize: "0.85rem" }}
                >
                  {["Tất cả", "User", "Admin", "Moderator"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textSecondary }} />
              </div>
              {/* Status filter */}
              <div className="relative">
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="rounded-xl px-3 py-2 pr-8 outline-none appearance-none cursor-pointer"
                  style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textPrimary, fontSize: "0.85rem" }}
                >
                  {["Tất cả", "Hoạt động", "Không HĐ"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textSecondary }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors" style={{ borderColor, color: textSecondary, fontSize: "0.85rem", backgroundColor: inputBg }}>
                <Download className="w-4 h-4" /> Xuất CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition-colors text-white" style={{ fontSize: "0.85rem" }}>
                <Plus className="w-4 h-4" /> Thêm người dùng
              </button>
            </div>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#0f172a" }}>
                {["Avatar", "Họ và tên", "Email", "Vai trò", "Trạng thái", "Ngày tham gia", "Hành động"].map((h) => (
                  <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t transition-colors" style={{ borderColor }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0f172a"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                >
                  <td className="px-5 py-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${user.color}25` }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: user.color }}>{user.initials}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{user.name}</p>
                      <p style={{ fontSize: "0.72rem", color: textSecondary, fontFamily: "monospace" }}>{user.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span style={{ fontSize: "0.8rem", color: textSecondary }}>{user.email}</span></td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-1 rounded-full" style={{
                      fontSize: "0.75rem", fontWeight: 600,
                      backgroundColor: user.role === "Admin" ? "#8b5cf620" : user.role === "Moderator" ? "#3b82f620" : "#64748b20",
                      color: user.role === "Admin" ? "#a78bfa" : user.role === "Moderator" ? "#60a5fa" : textSecondary
                    }}>{user.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: user.status === "active" ? "#16a34a20" : "#ef444420", color: user.status === "active" ? "#22c55e" : "#ef4444" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.status === "active" ? "#22c55e" : "#ef4444" }}></span>
                      {user.status === "active" ? "Hoạt động" : "Không HĐ"}
                    </span>
                  </td>
                  <td className="px-5 py-3"><span style={{ fontSize: "0.8rem", color: textSecondary }}>{user.joined}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4 text-blue-400" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors" title="Chỉnh sửa"><Edit3 className="w-4 h-4 text-yellow-400" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Xóa"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor }}>
            <p style={{ fontSize: "0.8rem", color: textSecondary }}>Hiển thị {filtered.length} / {allUsers.length} người dùng</p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg transition-colors" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textSecondary }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3].map((p) => (
                <button key={p} className="w-8 h-8 rounded-lg transition-colors" style={{ backgroundColor: p === 1 ? "#16a34a" : inputBg, border: `1px solid ${p === 1 ? "#16a34a" : borderColor}`, color: p === 1 ? "#fff" : textSecondary, fontSize: "0.8rem" }}>{p}</button>
              ))}
              <button className="p-2 rounded-lg transition-colors" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textSecondary }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  /* ─── CONTENT MANAGEMENT SECTION ─── */
  const renderContent = () => {
    const filteredFood = foodDatabase.filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase()));

    return (
      <div className="relative">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 mb-6 rounded-xl p-1" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, width: "fit-content" }}>
          {[
            { id: "food", label: "Cơ sở dữ liệu thực phẩm", icon: Utensils },
            { id: "mealplans", label: "Kế hoạch ăn uống", icon: BookOpen },
            { id: "articles", label: "Bài viết", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setContentTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all"
              style={{
                backgroundColor: contentTab === tab.id ? "#16a34a" : "transparent",
                color: contentTab === tab.id ? "#fff" : textSecondary,
                fontSize: "0.875rem", fontWeight: contentTab === tab.id ? 600 : 500,
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* FOOD DATABASE TAB */}
        {contentTab === "food" && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
            <div className="flex items-center justify-between px-5 py-4 border-b gap-4" style={{ borderColor }}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-sm" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: textSecondary }} />
                <input placeholder="Tìm kiếm thực phẩm..." value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} className="bg-transparent outline-none flex-1" style={{ fontSize: "0.85rem", color: textPrimary }} />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select className="rounded-xl px-3 py-2 pr-8 outline-none appearance-none cursor-pointer" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textPrimary, fontSize: "0.85rem" }}>
                    <option>Tất cả danh mục</option>
                    <option>Súp & Cháo</option>
                    <option>Cơm</option>
                    <option>Bún</option>
                    <option>Rau củ</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textSecondary }} />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition-colors text-white" style={{ fontSize: "0.85rem" }}>
                  <Plus className="w-4 h-4" /> Thêm món ăn
                </button>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#0f172a" }}>
                  {["Tên món ăn", "Danh mục", "Calo (kcal)", "Protein (g)", "Chất béo (g)", "Carbs (g)", "Hành động"].map((h) => (
                    <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFood.map((food) => (
                  <tr key={food.id} className="border-t transition-colors" style={{ borderColor }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0f172a"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-900/40 flex items-center justify-center flex-shrink-0">
                          <Utensils className="w-4 h-4 text-green-400" />
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{food.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: "#3b82f620", color: "#60a5fa" }}>{food.category}</span></td>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f59e0b" }}>{food.calories}</span></td>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", color: "#22c55e" }}>{food.protein}g</span></td>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", color: "#f87171" }}>{food.fat}g</span></td>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", color: "#a78bfa" }}>{food.carbs}g</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors"><Edit3 className="w-4 h-4 text-yellow-400" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor }}>
              <p style={{ fontSize: "0.8rem", color: textSecondary }}>{filteredFood.length} món ăn trong cơ sở dữ liệu</p>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textSecondary }}><ChevronLeft className="w-4 h-4" /></button>
                {[1, 2, 3].map((p) => <button key={p} className="w-8 h-8 rounded-lg" style={{ backgroundColor: p === 1 ? "#16a34a" : inputBg, border: `1px solid ${p === 1 ? "#16a34a" : borderColor}`, color: p === 1 ? "#fff" : textSecondary, fontSize: "0.8rem" }}>{p}</button>)}
                <button className="p-2 rounded-lg" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textSecondary }}><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}

        {/* MEAL PLANS TAB */}
        {contentTab === "mealplans" && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>Kế hoạch ăn uống</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition-colors text-white" style={{ fontSize: "0.85rem" }}>
                <Plus className="w-4 h-4" /> Tạo kế hoạch mới
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#0f172a" }}>
                  {["Tên kế hoạch", "Mục tiêu", "Calo mục tiêu", "Số bữa ăn", "Trạng thái", "Hành động"].map((h) => (
                    <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mealPlans.map((plan) => (
                  <tr key={plan.id} className="border-t" style={{ borderColor }}>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{plan.name}</span></td>
                    <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: "#16a34a20", color: "#22c55e" }}>{plan.target}</span></td>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f59e0b" }}>{plan.calories} kcal</span></td>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", color: textSecondary }}>{plan.meals} bữa</span></td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: plan.status === "active" ? "#16a34a20" : "#f59e0b20", color: plan.status === "active" ? "#22c55e" : "#f59e0b" }}>
                        {plan.status === "active" ? "Đang hoạt động" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded-lg hover:bg-blue-500/10"><Eye className="w-4 h-4 text-blue-400" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-yellow-500/10"><Edit3 className="w-4 h-4 text-yellow-400" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ARTICLES TAB */}
        {contentTab === "articles" && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>Bài viết & Nội dung</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition-colors text-white" style={{ fontSize: "0.85rem" }}>
                <Plus className="w-4 h-4" /> Viết bài mới
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#0f172a" }}>
                  {["Tiêu đề", "Tác giả", "Danh mục", "Lượt xem", "Trạng thái", "Hành động"].map((h) => (
                    <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-t" style={{ borderColor }}>
                    <td className="px-5 py-3" style={{ maxWidth: "280px" }}><span style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{article.title}</span></td>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.8rem", color: textSecondary }}>{article.author}</span></td>
                    <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: "#3b82f620", color: "#60a5fa" }}>{article.category}</span></td>
                    <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", color: textSecondary }}>{article.views.toLocaleString()}</span></td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: article.status === "published" ? "#16a34a20" : article.status === "draft" ? "#64748b20" : "#f59e0b20", color: article.status === "published" ? "#22c55e" : article.status === "draft" ? textSecondary : "#f59e0b" }}>
                        {article.status === "published" ? "Đã đăng" : article.status === "draft" ? "Nháp" : "Đang duyệt"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded-lg hover:bg-blue-500/10"><Eye className="w-4 h-4 text-blue-400" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-yellow-500/10"><Edit3 className="w-4 h-4 text-yellow-400" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  /* ─── ANALYTICS SECTION ─── */
  const renderAnalytics = () => (
    <>
      {/* Date Range Picker */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <Calendar className="w-4 h-4" style={{ color: textSecondary }} />
          <span style={{ fontSize: "0.85rem", color: textSecondary }}>Từ:</span>
          <input type="date" defaultValue="2026-02-14" className="bg-transparent outline-none" style={{ fontSize: "0.85rem", color: textPrimary, colorScheme: "dark" }} />
          <span style={{ color: borderColor }}>→</span>
          <span style={{ fontSize: "0.85rem", color: textSecondary }}>Đến:</span>
          <input type="date" defaultValue="2026-03-14" className="bg-transparent outline-none" style={{ fontSize: "0.85rem", color: textPrimary, colorScheme: "dark" }} />
        </div>
        <div className="flex items-center gap-2">
          {["7 ngày", "30 ngày", "90 ngày", "Năm nay"].map((r) => (
            <button key={r} onClick={() => setAnalyticsRange(r)} className="px-4 py-2 rounded-xl transition-colors" style={{ backgroundColor: analyticsRange === r ? "#16a34a" : cardBg, border: `1px solid ${analyticsRange === r ? "#16a34a" : borderColor}`, color: analyticsRange === r ? "#fff" : textSecondary, fontSize: "0.85rem" }}>
              {r}
            </button>
          ))}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors" style={{ borderColor, color: textSecondary, backgroundColor: cardBg, fontSize: "0.85rem" }}>
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {[
          { label: "Tổng bữa ăn ghi nhận", value: "28,640", change: "+14%", color: "#16a34a" },
          { label: "Người dùng mới", value: "2,481", change: "+22%", color: "#3b82f6" },
          { label: "Lượt dùng AI", value: "94.2K", change: "+18%", color: "#8b5cf6" },
          { label: "Công thức được lưu", value: "15,320", change: "+9%", color: "#f59e0b" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor }}>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: textPrimary }}>{k.value}</p>
            <p style={{ fontSize: "0.78rem", color: textSecondary, marginTop: "2px" }}>{k.label}</p>
            <span className="inline-flex items-center gap-1 mt-2" style={{ fontSize: "0.75rem", color: "#22c55e" }}>
              <TrendingUp className="w-3 h-3" />{k.change} so với kỳ trước
            </span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Bar chart - Daily meals */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="mb-4">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Bữa ăn ghi nhận hàng ngày</h3>
            <p style={{ fontSize: "0.75rem", color: textSecondary }}>7 ngày gần nhất</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyMealsData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: textSecondary }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: textSecondary }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", fontSize: "0.75rem", color: textPrimary }} formatter={(v: number) => [v.toLocaleString(), "Bữa ăn"]} />
              <Bar dataKey="meals" radius={[6, 6, 0, 0]}>
                {dailyMealsData.map((_, i) => (
                  <Cell key={i} fill={i === dailyMealsData.length - 1 ? "#16a34a" : "#16a34a60"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - Nutrition distribution */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="mb-4">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Phân bổ mục tiêu dinh dưỡng</h3>
            <p style={{ fontSize: "0.75rem", color: textSecondary }}>Trung bình tất cả người dùng</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={nutritionPieData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" paddingAngle={3}>
                {nutritionPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", fontSize: "0.75rem", color: textPrimary }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-1">
            {nutritionPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span style={{ fontSize: "0.78rem", color: textSecondary }}>{d.name}</span>
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: textPrimary }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line chart - User growth */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="mb-4">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Tăng trưởng người dùng</h3>
            <p style={{ fontSize: "0.75rem", color: textSecondary }}>30 ngày qua</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowthData}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: textSecondary }} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: textSecondary }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", fontSize: "0.75rem", color: textPrimary }} formatter={(v: number) => [v.toLocaleString(), "Người dùng"]} />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Vietnamese Dishes Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textPrimary }}>Top 10 Món Việt Được Tìm Kiếm Nhiều Nhất</h3>
            <p style={{ fontSize: "0.78rem", color: textSecondary }}>Dữ liệu trong 30 ngày qua</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor, color: textSecondary, backgroundColor: inputBg, fontSize: "0.8rem" }}>
            <Download className="w-4 h-4" /> Xuất
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#0f172a" }}>
              {["#", "Tên món ăn", "Danh mục", "Lượt tìm kiếm", "Calo TB (kcal)", "Xu hướng"].map((h) => (
                <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: textSecondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top10Dishes.map((dish) => (
              <tr key={dish.rank} className="border-t" style={{ borderColor }}>
                <td className="px-5 py-3">
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: dish.rank <= 3 ? "#f59e0b" : textSecondary }}>{dish.rank}</span>
                </td>
                <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{dish.dish}</span></td>
                <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: "#3b82f620", color: "#60a5fa" }}>{dish.category}</span></td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full h-1.5" style={{ width: `${(dish.searches / 18420) * 100}px`, backgroundColor: "#16a34a", maxWidth: "80px" }}></div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{dish.searches.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-5 py-3"><span style={{ fontSize: "0.875rem", color: "#f59e0b", fontWeight: 600 }}>{dish.calories}</span></td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1" style={{ fontSize: "0.8rem", color: dish.trend === "up" ? "#22c55e" : "#ef4444" }}>
                    {dish.trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {dish.trend === "up" ? "Tăng" : "Giảm"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* ─── AI SETTINGS SECTION ─── */
  const renderAISettings = () => (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="rounded-2xl p-5 mb-5 border" style={{ backgroundColor: "#0a2540", borderColor: "#1e3a5f" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Cấu hình AI NutriPath</h3>
            <p style={{ fontSize: "0.78rem", color: textSecondary }}>Quản lý mô hình AI và các tham số khuyến nghị dinh dưỡng</p>
          </div>
        </div>
      </div>

      {/* Model Selector */}
      <div className="rounded-2xl p-6 border mb-5" style={{ backgroundColor: cardBg, borderColor }}>
        <h4 className="mb-4" style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Mô hình AI</h4>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "Gemini 1.5 Pro", label: "Gemini 1.5 Pro", desc: "Google DeepMind · Khuyến nghị", badge: "Đang dùng" },
            { id: "GPT-4o", label: "GPT-4o", desc: "OpenAI · Hiệu suất cao", badge: null },
            { id: "Claude 3.5", label: "Claude 3.5 Sonnet", desc: "Anthropic · Phân tích sâu", badge: null },
          ].map((model) => (
            <button
              key={model.id}
              onClick={() => setAiModel(model.id)}
              className="p-4 rounded-xl border text-left transition-all"
              style={{ backgroundColor: aiModel === model.id ? "#16a34a15" : inputBg, borderColor: aiModel === model.id ? "#16a34a" : borderColor }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                {aiModel === model.id && <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></span>}
              </div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: textPrimary }}>{model.label}</p>
              <p style={{ fontSize: "0.72rem", color: textSecondary, marginTop: "2px" }}>{model.desc}</p>
              {model.badge && <span className="inline-block mt-2 px-2 py-0.5 rounded-full" style={{ fontSize: "0.68rem", backgroundColor: "#16a34a20", color: "#22c55e" }}>{model.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="rounded-2xl p-6 border mb-5" style={{ backgroundColor: cardBg, borderColor }}>
        <h4 className="mb-5" style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Tính năng AI</h4>
        <div className="space-y-5">
          {[
            { label: "Tự động khuyến nghị khẩu phần ăn", desc: "AI sẽ tự động đề xuất kích thước khẩu phần phù hợp dựa trên mục tiêu của người dùng", value: autoPortionRec, set: setAutoPortionRec },
            { label: "Gợi ý bữa ăn thông minh", desc: "Phân tích lịch sử ăn uống và đề xuất thực đơn phù hợp theo sở thích", value: smartMealSuggestions, set: setSmartMealSuggestions },
            { label: "Cảnh báo xác thực dinh dưỡng", desc: "Thông báo khi phát hiện mất cân bằng dinh dưỡng nghiêm trọng trong thực đơn", value: nutritionValidation, set: setNutritionValidation },
          ].map((setting) => (
            <div key={setting.label} className="flex items-start justify-between gap-4 py-4 border-b" style={{ borderColor: `${borderColor}60` }}>
              <div className="flex-1">
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{setting.label}</p>
                <p style={{ fontSize: "0.78rem", color: textSecondary, marginTop: "4px" }}>{setting.desc}</p>
              </div>
              <Toggle enabled={setting.value} onToggle={() => setting.set(!setting.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Threshold Slider */}
      <div className="rounded-2xl p-6 border mb-5" style={{ backgroundColor: cardBg, borderColor }}>
        <h4 className="mb-5" style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Tham số AI</h4>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>Ngưỡng độ tin cậy AI</p>
              <p style={{ fontSize: "0.75rem", color: textSecondary }}>AI chỉ đưa ra khuyến nghị khi độ tin cậy đạt ngưỡng này</p>
            </div>
            <span className="px-3 py-1 rounded-xl" style={{ backgroundColor: "#16a34a20", color: "#22c55e", fontSize: "1rem", fontWeight: 800 }}>{confidenceThreshold}%</span>
          </div>
          <div className="relative">
            <div className="w-full rounded-full h-2" style={{ backgroundColor: "#334155" }}>
              <div className="h-2 rounded-full bg-gradient-to-r from-green-600 to-green-400" style={{ width: `${confidenceThreshold}%` }}></div>
            </div>
            <input
              type="range" min={0} max={100} value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span style={{ fontSize: "0.7rem", color: textSecondary }}>0% (Rủi ro)</span>
            <span style={{ fontSize: "0.7rem", color: "#22c55e" }}>75% (Được khuyến nghị)</span>
            <span style={{ fontSize: "0.7rem", color: textSecondary }}>100% (Nghiêm ngặt)</span>
          </div>
        </div>

        {/* Calorie Formula */}
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary, marginBottom: "8px" }}>Công thức tính calo BMR</p>
          <p style={{ fontSize: "0.75rem", color: textSecondary, marginBottom: "12px" }}>Mifflin-St Jeor Equation — được sử dụng để tính tỉ lệ trao đổi chất cơ bản</p>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <span style={{ fontSize: "0.8rem", color: "#a78bfa", fontFamily: "monospace" }}>BMR =</span>
            <input
              value={calorieFormula}
              onChange={(e) => setCalorieFormula(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: "0.85rem", color: textPrimary, fontFamily: "monospace" }}
            />
          </div>
          <p style={{ fontSize: "0.72rem", color: textSecondary, marginTop: "6px" }}>W = Cân nặng (kg) · H = Chiều cao (cm) · A = Tuổi (năm)</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {aiSaved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#16a34a20", border: "1px solid #16a34a40" }}>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span style={{ fontSize: "0.85rem", color: "#22c55e" }}>Đã lưu cài đặt thành công!</span>
          </div>
        )}
        {!aiSaved && <div />}
        <button
          onClick={() => { setAiSaved(true); setTimeout(() => setAiSaved(false), 3000); }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 transition-colors text-white"
          style={{ fontSize: "0.9rem", fontWeight: 600 }}
        >
          <Save className="w-4 h-4" /> Lưu cài đặt
        </button>
      </div>
    </div>
  );

  /* ─── SECURITY SECTION ─── */
  const renderSecurity = () => (
    <div className="max-w-4xl space-y-5">
      {/* 2FA Section */}
      <div className="rounded-2xl p-6 border" style={{ backgroundColor: cardBg, borderColor }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Xác thực hai yếu tố (2FA)</h4>
              <p style={{ fontSize: "0.78rem", color: textSecondary }}>Bảo vệ tài khoản admin bằng lớp xác thực bổ sung</p>
            </div>
          </div>
          <Toggle enabled={twoFAEnabled} onToggle={() => setTwoFAEnabled(!twoFAEnabled)} />
        </div>
        {twoFAEnabled ? (
          <div className="rounded-xl p-4 border" style={{ backgroundColor: "#16a34a10", borderColor: "#16a34a30" }}>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#22c55e" }}>2FA đang hoạt động</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: textSecondary }}>Đăng nhập tiếp theo sẽ yêu cầu mã từ ứng dụng xác thực (Google Authenticator / Authy)</p>
            <div className="flex gap-3 mt-3">
              <button className="px-4 py-2 rounded-lg border" style={{ borderColor, color: textSecondary, fontSize: "0.8rem", backgroundColor: inputBg }}>Xem mã dự phòng</button>
              <button className="px-4 py-2 rounded-lg border" style={{ borderColor, color: textSecondary, fontSize: "0.8rem", backgroundColor: inputBg }}>Thiết lập lại 2FA</button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4 border" style={{ backgroundColor: "#f59e0b10", borderColor: "#f59e0b30" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span style={{ fontSize: "0.85rem", color: "#f59e0b" }}>2FA chưa được bật. Tài khoản của bạn kém bảo mật hơn.</span>
            </div>
          </div>
        )}
      </div>

      {/* Password Policy */}
      <div className="rounded-2xl p-6 border" style={{ backgroundColor: cardBg, borderColor }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Chính sách mật khẩu</h4>
            <p style={{ fontSize: "0.78rem", color: textSecondary }}>Quy tắc áp dụng cho tất cả tài khoản trên hệ thống</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: "Độ dài tối thiểu 8 ký tự", desc: "Mật khẩu phải có ít nhất 8 ký tự", value: minPassword, set: setMinPassword },
            { label: "Yêu cầu ký tự đặc biệt", desc: "Phải chứa ít nhất một ký tự như !@#$%^&*", value: requireSpecialChar, set: setRequireSpecialChar },
            { label: "Yêu cầu chữ hoa", desc: "Phải chứa ít nhất một chữ cái in hoa (A-Z)", value: requireUppercase, set: setRequireUppercase },
            { label: "Yêu cầu chữ số", desc: "Phải chứa ít nhất một chữ số (0-9)", value: requireNumber, set: setRequireNumber },
          ].map((policy) => (
            <div key={policy.label} className="flex items-center justify-between py-3 border-b" style={{ borderColor: `${borderColor}60` }}>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary }}>{policy.label}</p>
                <p style={{ fontSize: "0.75rem", color: textSecondary }}>{policy.desc}</p>
              </div>
              <Toggle enabled={policy.value} onToggle={() => policy.set(!policy.value)} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span style={{ fontSize: "0.8rem", color: textSecondary }}>Độ mạnh mật khẩu tối thiểu:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-12 h-2 rounded-full" style={{ backgroundColor: i <= [minPassword, requireSpecialChar, requireUppercase, requireNumber].filter(Boolean).length ? "#16a34a" : "#334155" }}></div>
            ))}
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#22c55e" }}>
            {["Yếu", "Trung bình", "Khá", "Mạnh"][[minPassword, requireSpecialChar, requireUppercase, requireNumber].filter(Boolean).length - 1] || "Yếu"}
          </span>
        </div>
      </div>

      {/* Login Activity */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: textPrimary }}>Lịch sử đăng nhập</h4>
              <p style={{ fontSize: "0.75rem", color: textSecondary }}>Các phiên đăng nhập gần đây vào tài khoản admin</p>
            </div>
          </div>
          <button
            onClick={() => setShowRevokeConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-white"
            style={{ backgroundColor: "#ef4444", fontSize: "0.85rem", fontWeight: 600 }}
          >
            <XCircle className="w-4 h-4" /> Thu hồi tất cả phiên
          </button>
        </div>

        {showRevokeConfirm && (
          <div className="mx-5 mt-4 p-4 rounded-xl border" style={{ backgroundColor: "#ef444410", borderColor: "#ef444440" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span style={{ fontSize: "0.875rem", color: "#f87171", fontWeight: 600 }}>Xác nhận thu hồi tất cả phiên đăng nhập?</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowRevokeConfirm(false)} className="px-3 py-1.5 rounded-lg border" style={{ borderColor, color: textSecondary, fontSize: "0.8rem", backgroundColor: inputBg }}>Hủy</button>
                <button onClick={() => setShowRevokeConfirm(false)} className="px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#ef4444", fontSize: "0.8rem" }}>Xác nhận</button>
              </div>
            </div>
          </div>
        )}

        <table className="w-full mt-2">
          <thead>
            <tr style={{ backgroundColor: "#0f172a" }}>
              {["Địa chỉ IP", "Thiết bị / Trình duyệt", "Vị trí", "Thời gian", "Trạng thái"].map((h) => (
                <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: textSecondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loginActivity.map((log, i) => (
              <tr key={i} className="border-t" style={{ borderColor }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textSecondary }} />
                    <span style={{ fontSize: "0.8rem", color: textPrimary, fontFamily: "monospace" }}>{log.ip}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textSecondary }} />
                    <span style={{ fontSize: "0.8rem", color: textSecondary }}>{log.device}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textSecondary }} />
                    <span style={{ fontSize: "0.8rem", color: textSecondary }}>{log.location}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textSecondary }} />
                    <span style={{ fontSize: "0.8rem", color: textSecondary }}>{log.time}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{
                    fontSize: "0.75rem", fontWeight: 600,
                    backgroundColor: log.status === "success" ? "#16a34a20" : "#ef444420",
                    color: log.status === "success" ? "#22c55e" : "#ef4444"
                  }}>
                    {log.status === "success" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {log.status === "success" ? "Thành công" : "Thất bại"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ─── MAIN RENDER ─── */
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: bg, fontFamily: "Inter, sans-serif" }}>
      {/* SIDEBAR */}
      <aside className="flex-shrink-0 flex flex-col" style={{ width: "240px", backgroundColor: sidebarBg, borderRight: `1px solid #1e3a5f` }}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: "#1e3a5f" }}>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white" style={{ fontSize: "0.95rem", fontWeight: 700 }}>NutriPath</span>
              <p className="text-green-400" style={{ fontSize: "0.7rem" }}>Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ label, icon: Icon, id }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                backgroundColor: activeNav === id ? "#16a34a" : "transparent",
                color: activeNav === id ? "#ffffff" : "#94a3b8",
              }}
              onMouseEnter={(e) => { if (activeNav !== id) (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg; }}
              onMouseLeave={(e) => { if (activeNav !== id) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span style={{ fontSize: "0.875rem", fontWeight: activeNav === id ? 600 : 500 }}>{label}</span>
              {activeNav === id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* System Status */}
        <div className="p-4 border-t" style={{ borderColor: "#1e3a5f" }}>
          <div className="rounded-xl p-3" style={{ backgroundColor: "#0a2540" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-400" style={{ fontSize: "0.75rem", fontWeight: 600 }}>Hệ thống hoạt động tốt</span>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#64748b" }}>Uptime: 99.9% · 30 ngày</p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-4 flex items-center justify-between border-t" style={{ borderColor: "#1e3a5f" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white" style={{ fontSize: "0.75rem", fontWeight: 700 }}>SA</span>
            </div>
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: textPrimary }}>Super Admin</p>
              <p style={{ fontSize: "0.68rem", color: textSecondary }}>admin@nutripath.vn</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b flex-shrink-0" style={{ backgroundColor: cardBg, borderColor }}>
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: textPrimary }}>{pageTitle[activeNav]}</h1>
            <p style={{ fontSize: "0.8rem", color: textSecondary }}>Thứ Bảy, 14 tháng 3 năm 2026</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "#334155" }}>
              <Search className="w-4 h-4" style={{ color: textSecondary }} />
              <input placeholder="Tìm kiếm..." className="bg-transparent outline-none" style={{ fontSize: "0.85rem", color: textPrimary, width: "160px" }} />
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl transition-colors"
              style={{ backgroundColor: "#334155" }}
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>
            <button className="relative p-2 rounded-xl" style={{ backgroundColor: "#334155" }}>
              <Bell className="w-4 h-4" style={{ color: textPrimary }} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeNav === "dashboard" && renderDashboard()}
          {activeNav === "users" && renderUsers()}
          {activeNav === "content" && renderContent()}
          {activeNav === "analytics" && renderAnalytics()}
          {activeNav === "ai" && renderAISettings()}
          {activeNav === "security" && renderSecurity()}
        </main>
      </div>
    </div>
  );
}
