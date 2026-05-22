import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Bell,
  BookOpen,
  Calculator,
  CreditCard,
  Crown,
  FileBarChart,
  LayoutDashboard,
  Leaf,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  UserPlus,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useAuth } from "../../auth";
import { getNotifications, markAllNotificationsRead, type AppNotification } from "../../api";
import { ThemeToggle } from "../ThemeToggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calculator", label: "Tính Calo", icon: Calculator },
  { href: "/tracker", label: "Theo Dõi", icon: UtensilsCrossed },
  { href: "/recipes", label: "Công Thức", icon: BookOpen },
  { href: "/reports", label: "Báo cáo", icon: FileBarChart },
  { href: "/pricing", label: "Gói thành viên", icon: CreditCard },
];

interface NavbarProps {
  isLanding?: boolean;
}

export function Navbar({ isLanding = false }: NavbarProps) {
  const location = useLocation();
  const { session, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const member = session?.member;
  const canAccessAdmin = member?.role?.toLowerCase() === "admin";

  useEffect(() => {
    if (!member) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let active = true;
    getNotifications({ limit: 5 })
      .then((data) => {
        if (!active) return;
        setNotifications(data._embedded.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {
        if (!active) return;
        setNotifications([]);
        setUnreadCount(0);
      });

    return () => {
      active = false;
    };
  }, [member?.id, member?.calorieTarget, member?.subscription?.daysRemaining]);

  const navBg = isLanding
    ? "bg-transparent absolute top-0 left-0 right-0 z-50"
    : "bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm dark:bg-slate-900 dark:border-slate-800";

  const linkColor = isLanding ? "text-white/90 hover:text-white" : "text-gray-600 hover:text-green-600 dark:text-slate-300 dark:hover:text-green-300";
  const logoColor = isLanding ? "text-white" : "text-green-600";
  const buttonGhost = isLanding ? "text-white/90 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-green-700 hover:bg-green-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-green-300";

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
  };

  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsRead().catch(() => null);
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(0);
  };

  return (
    <nav className={navBg}>
      <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLanding ? "bg-white/20" : "bg-green-600"}`}>
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className={`font-extrabold tracking-tight ${logoColor}`} style={{ fontSize: "1.1rem" }}>NutriPath</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? isLanding ? "bg-white/20 text-white" : "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : linkColor
                }`}
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/svip"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${isLanding ? "text-amber-200 hover:text-amber-100" : "text-amber-600 hover:text-amber-700"}`}
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
          >
            <Crown className="w-4 h-4" />
            SVIP
          </Link>
          {canAccessAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${linkColor}`}
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          )}

          {member ? (
            <>
              <ThemeToggle compact isLanding={isLanding} />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((value) => !value)}
                  className={`relative p-2 rounded-full transition-all ${isLanding ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}`}
                  aria-expanded={notificationsOpen}
                  aria-label="Mở thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-50">Thông báo</p>
                      <button
                        type="button"
                        onClick={() => void handleMarkAllNotificationsRead()}
                        className="text-xs font-semibold text-green-600 hover:text-green-700"
                      >
                        Đánh dấu đã đọc
                      </button>
                    </div>
                    <div className="space-y-2">
                      {notifications.length ? notifications.map((item) => (
                        <Link
                          key={item.id}
                          to={item.actionHref || "/member"}
                          onClick={() => setNotificationsOpen(false)}
                          className={`block rounded-xl px-3 py-2.5 ${item.readAt ? "bg-slate-50 dark:bg-slate-800" : "bg-green-50 dark:bg-green-500/10"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">{item.title}</p>
                            {!item.readAt && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />}
                          </div>
                          <p className="mt-0.5 text-xs leading-5 text-gray-500 dark:text-slate-300">{item.text}</p>
                        </Link>
                      )) : (
                        <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          Chưa có thông báo mới.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/member" className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLanding ? "bg-white/20 text-white" : "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"}`} style={{ fontSize: "0.78rem", fontWeight: 800 }}>
                  {member.initials}
                </div>
                <span className={`${isLanding ? "text-white" : "text-gray-700 dark:text-slate-100"} hover:underline max-w-[130px] truncate`} style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {member.name}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${buttonGhost}`}
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <ThemeToggle compact isLanding={isLanding} />
              <Link
                to="/login"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${buttonGhost}`}
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                  isLanding ? "bg-white text-green-700 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700"
                }`}
                style={{ fontSize: "0.875rem", fontWeight: 700 }}
              >
                <UserPlus className="w-4 h-4" />
                Đăng ký
              </Link>
            </>
          )}

        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle compact isLanding={isLanding} />
          <button
            className={`p-2 ${isLanding ? "text-white" : "text-gray-600 dark:text-slate-200"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={`md:hidden ${isLanding ? "bg-green-700/95" : "bg-white border-b border-gray-100 dark:bg-slate-900 dark:border-slate-800"} px-6 py-4`}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-2 py-2.5 ${isLanding ? "text-white" : "text-gray-700 dark:text-slate-200"}`}
              style={{ fontSize: "0.9rem", fontWeight: 500 }}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link
            to="/svip"
            className={`flex items-center gap-2 py-2.5 ${isLanding ? "text-white" : "text-gray-700 dark:text-slate-200"}`}
            onClick={() => setMobileOpen(false)}
          >
            <Crown className="w-4 h-4" />
            SVIP
          </Link>
          {canAccessAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-2 py-2.5 ${isLanding ? "text-white" : "text-gray-700 dark:text-slate-200"}`}
              onClick={() => setMobileOpen(false)}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          )}
          <div className={`mt-3 pt-3 border-t ${isLanding ? "border-white/20" : "border-gray-100 dark:border-slate-800"}`}>
            {member ? (
              <>
                <Link
                  to="/member"
                  className={`flex items-center gap-2 py-2.5 ${isLanding ? "text-white" : "text-gray-700 dark:text-slate-200"}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isLanding ? "bg-white/20" : "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"}`} style={{ fontSize: "0.78rem", fontWeight: 800 }}>
                    {member.initials}
                  </span>
                  {member.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className={`flex w-full items-center gap-2 py-2.5 ${isLanding ? "text-white" : "text-gray-700 dark:text-slate-200"}`}
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 ${isLanding ? "border-white/25 text-white" : "border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-200"}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserPlus className="w-4 h-4" />
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
