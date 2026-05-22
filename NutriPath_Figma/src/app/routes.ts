import { createBrowserRouter } from "react-router";
import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { Root } from "./components/layout/Root";
import { RequireAdmin, RequireAuth } from "./auth";

const LandingPage = lazy(() => import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const CalorieCalculator = lazy(() => import("./pages/CalorieCalculator").then((module) => ({ default: module.CalorieCalculator })));
const MealTracker = lazy(() => import("./pages/MealTracker").then((module) => ({ default: module.MealTracker })));
const Recipes = lazy(() => import("./pages/Recipes").then((module) => ({ default: module.Recipes })));
const Admin = lazy(() => import("./pages/Admin").then((module) => ({ default: module.Admin })));
const PricingPlans = lazy(() => import("./pages/PricingPlans").then((module) => ({ default: module.PricingPlans })));
const SVIPLanding = lazy(() => import("./pages/SVIPLanding").then((module) => ({ default: module.SVIPLanding })));
const Checkout = lazy(() => import("./pages/Checkout").then((module) => ({ default: module.Checkout })));
const MemberProfile = lazy(() => import("./pages/MemberProfile").then((module) => ({ default: module.MemberProfile })));
const Reports = lazy(() => import("./pages/Reports").then((module) => ({ default: module.Reports })));
const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));
const Register = lazy(() => import("./pages/Register").then((module) => ({ default: module.Register })));

function PageFallback() {
  return createElement(
    "div",
    { className: "min-h-screen bg-slate-50 p-8 text-slate-500 dark:bg-slate-950 dark:text-slate-300" },
    "Đang tải trang...",
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
    children: [
      { index: true, Component: PublicLanding },
      { path: "login", Component: PublicLogin },
      { path: "register", Component: PublicRegister },
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
  },
]);
