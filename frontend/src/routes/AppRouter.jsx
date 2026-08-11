import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuthenticatedLayout from "../layouts/AuthenticatedLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import { publicRoutes, dashboardRoutes, notFoundRoute } from "./routes";

function AppRouter() {
  return (
    <Suspense fallback={<h2>Loading...</h2>}>
      <Routes>
        <Route
          path="/"
          element={<MainLayout />}
        >
          {publicRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          {dashboardRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        
        <Route path={notFoundRoute.path} element={notFoundRoute.element} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;