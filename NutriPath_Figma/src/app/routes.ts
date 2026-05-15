import { createBrowserRouter } from "react-router";
import { createElement, type ComponentType } from "react";
import { Root } from "./components/layout/Root";
import { RequireAdmin, RequireAuth } from "./auth";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { CalorieCalculator } from "./pages/CalorieCalculator";
import { MealTracker } from "./pages/MealTracker";
import { Recipes } from "./pages/Recipes";
import { Admin } from "./pages/Admin";
import { PricingPlans } from "./pages/PricingPlans";
import { SVIPLanding } from "./pages/SVIPLanding";
import { Checkout } from "./pages/Checkout";
import { MemberProfile } from "./pages/MemberProfile";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

function protectedComponent(Component: ComponentType) {
  return function ProtectedPage() {
    return createElement(RequireAuth, null, createElement(Component));
  };
}

function adminComponent(Component: ComponentType) {
  return function AdminPage() {
    return createElement(RequireAdmin, null, createElement(Component));
  };
}

const ProtectedDashboard = protectedComponent(Dashboard);
const ProtectedMealTracker = protectedComponent(MealTracker);
const ProtectedCheckout = protectedComponent(Checkout);
const ProtectedMemberProfile = protectedComponent(MemberProfile);
const ProtectedAdmin = adminComponent(Admin);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "dashboard", Component: ProtectedDashboard },
      { path: "calculator", Component: CalorieCalculator },
      { path: "tracker", Component: ProtectedMealTracker },
      { path: "recipes", Component: Recipes },
      { path: "pricing", Component: PricingPlans },
      { path: "svip", Component: SVIPLanding },
      { path: "checkout", Component: ProtectedCheckout },
      { path: "member", Component: ProtectedMemberProfile },
    ],
  },
  {
    path: "/admin",
    Component: ProtectedAdmin,
  },
]);
