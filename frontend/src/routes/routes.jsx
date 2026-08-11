import { lazy } from "react";

const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const RoadDesignChat = lazy(() => import("../pages/RoadDesignChat"));
const WhatsAppDrafts = lazy(() => import("../pages/WhatsAppDrafts"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Rendered inside MainLayout — no auth required
export const publicRoutes = [
  { path: "", element: <Home /> },
  { path: "login", element: <Login /> },
  { path: "register", element: <Register /> },
];

// Rendered inside AuthenticatedLayout — auth required (checked once, at layout level)
export const dashboardRoutes = [
  { path: "dashboard", element: <Dashboard /> },
  { path: "chat", element: <RoadDesignChat /> },
  { path: "drafts", element: <WhatsAppDrafts /> },
];

export const notFoundRoute = { path: "*", element: <NotFound /> };
