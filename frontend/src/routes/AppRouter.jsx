import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import routes from "./routes";

function AppRouter() {

    return (

        <Suspense fallback={<h2>Loading...</h2>}>

            <Routes>

                <Route path="/" element={<MainLayout />}>

                    {routes.map((route) => (

                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                route.requiresAuth ? (
                                    <ProtectedRoute>
                                        {route.element}
                                    </ProtectedRoute>
                                ) : (
                                    route.element
                                )
                            }
                        />

                    ))}

                </Route>

            </Routes>

        </Suspense>

    );

}

export default AppRouter;