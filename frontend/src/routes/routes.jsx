import { lazy } from "react";

const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Chat = lazy(() => import("../pages/Chat"));
const NotFound = lazy(() => import("../pages/NotFound"));

const routes = [
    {
        path: "",
        element: <Home />,
        requiresAuth: false,
    },
    {
        path: "login",
        element: <Login />,
        requiresAuth: false,
    },
    {
        path: "register",
        element: <Register />,
        requiresAuth: false,
    },
    {
        path: "chat",
        element: <Chat />,
        requiresAuth: true,
    },
    {
        path: "*",
        element: <NotFound />,
        requiresAuth: false,
    },
];

export default routes;