import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { createBrowserRouter, useRouteError } from "react-router";
import { RequireAdmin, RequireAuth } from "./auth";
import { Root } from "./components/layout/Root";

const CHUNK_RELOAD_KEY = "nutripath_chunk_reload_attempted";

function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(message);
}

function lazyWithRetry<TModule>(importer: () => Promise<TModule>, selectComponent: (module: TModule) => ComponentType) {
  return lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      }
      return { default: selectComponent(module) };
    } catch (error) {
      if (
        isChunkLoadError(error) &&
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(CHUNK_RELOAD_KEY) !== "true"
      ) {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "true");
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw error;
    }
  });
}

const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"), (module) => module.LandingPage);
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"), (module) => module.Dashboard);
const CalorieCalculator = lazyWithRetry(() => import("./pages/CalorieCalculator"), (module) => module.CalorieCalculator);
const MealTracker = lazyWithRetry(() => import("./pages/MealTracker"), (module) => module.MealTracker);
const Recipes = lazyWithRetry(() => import("./pages/Recipes"), (module) => module.Recipes);
const Admin = lazyWithRetry(() => import("./pages/Admin"), (module) => module.Admin);
const PricingPlans = lazyWithRetry(() => import("./pages/PricingPlans"), (module) => module.PricingPlans);
const SVIPLanding = lazyWithRetry(() => import("./pages/SVIPLanding"), (module) => module.SVIPLanding);
const Checkout = lazyWithRetry(() => import("./pages/Checkout"), (module) => module.Checkout);
const MemberProfile = lazyWithRetry(() => import("./pages/MemberProfile"), (module) => module.MemberProfile);
const Reports = lazyWithRetry(() => import("./pages/Reports"), (module) => module.Reports);
const Login = lazyWithRetry(() => import("./pages/Login"), (module) => module.Login);
const Register = lazyWithRetry(() => import("./pages/Register"), (module) => module.Register);
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"), (module) => module.AuthCallback);
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"), (module) => module.PrivacyPolicy);
const DataDeletion = lazyWithRetry(() => import("./pages/DataDeletion"), (module) => module.DataDeletion);

function PageFallback() {
  return createElement(
    "div",
    { className: "min-h-screen bg-slate-50 p-8 text-slate-500 dark:bg-slate-950 dark:text-slate-300" },
    "Đang tải trang...",
  );
}

function getRouteErrorMessage(error: unknown) {
  if (isChunkLoadError(error)) {
    return "Phiên bản giao diện vừa được cập nhật. Hãy tải lại trang để nhận bộ file mới nhất.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Ứng dụng gặp lỗi khi tải trang.";
}

function RouteErrorPage() {
  const error = useRouteError();
  const message = getRouteErrorMessage(error);

  return createElement(
    "main",
    {
      className: "min-h-screen bg-slate-50 px-6 py-16 text-slate-900 dark:bg-slate-950 dark:text-slate-50",
      role: "alert",
    },
    createElement(
      "section",
      {
        className:
          "mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900",
      },
      createElement("p", { className: "text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-400" }, "NutriPath"),
      createElement("h1", { className: "mt-3 text-2xl font-bold" }, "Không tải được trang"),
      createElement("p", { className: "mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300" }, message),
      createElement(
        "div",
        { className: "mt-6 flex flex-wrap gap-3" },
        createElement(
          "button",
          {
            className: "rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700",
            onClick: () => window.location.reload(),
            type: "button",
          },
          "Tải lại trang",
        ),
        createElement(
          "button",
          {
            className:
              "rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800",
            onClick: () => window.location.assign("/"),
            type: "button",
          },
          "Về trang chủ",
        ),
      ),
    ),
  );
}

function withSuspense(children: ReactNode) {
  return createElement(Suspense, { fallback: createElement(PageFallback) }, children);
}

function lazyComponent(Component: LazyExoticComponent<ComponentType>) {
  return function LazyPage() {
    return withSuspense(createElement(Component));
  };
}

function protectedComponent(Component: LazyExoticComponent<ComponentType>) {
  return function ProtectedPage() {
    return withSuspense(createElement(RequireAuth, null, createElement(Component)));
  };
}

function adminComponent(Component: LazyExoticComponent<ComponentType>) {
  return function AdminPage() {
    return withSuspense(createElement(RequireAdmin, null, createElement(Component)));
  };
}

const PublicLanding = lazyComponent(LandingPage);
const PublicLogin = lazyComponent(Login);
const PublicRegister = lazyComponent(Register);
const PublicAuthCallback = lazyComponent(AuthCallback);
const PublicPrivacyPolicy = lazyComponent(PrivacyPolicy);
const PublicDataDeletion = lazyComponent(DataDeletion);
const PublicCalculator = lazyComponent(CalorieCalculator);
const PublicRecipes = lazyComponent(Recipes);
const PublicPricingPlans = lazyComponent(PricingPlans);
const PublicSVIPLanding = lazyComponent(SVIPLanding);
const ProtectedDashboard = protectedComponent(Dashboard);
const ProtectedMealTracker = protectedComponent(MealTracker);
const ProtectedCheckout = protectedComponent(Checkout);
const ProtectedMemberProfile = protectedComponent(MemberProfile);
const ProtectedReports = protectedComponent(Reports);
const ProtectedAdmin = adminComponent(Admin);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: createElement(RouteErrorPage),
    children: [
      { index: true, Component: PublicLanding },
      { path: "login", Component: PublicLogin },
      { path: "register", Component: PublicRegister },
      { path: "auth/callback", Component: PublicAuthCallback },
      { path: "privacy", Component: PublicPrivacyPolicy },
      { path: "data-deletion", Component: PublicDataDeletion },
      { path: "dashboard", Component: ProtectedDashboard },
      { path: "calculator", Component: PublicCalculator },
      { path: "tracker", Component: ProtectedMealTracker },
      { path: "recipes", Component: PublicRecipes },
      { path: "pricing", Component: PublicPricingPlans },
      { path: "svip", Component: PublicSVIPLanding },
      { path: "checkout", Component: ProtectedCheckout },
      { path: "member", Component: ProtectedMemberProfile },
      { path: "reports", Component: ProtectedReports },
    ],
  },
  {
    path: "/admin",
    Component: ProtectedAdmin,
    errorElement: createElement(RouteErrorPage),
  },
]);
