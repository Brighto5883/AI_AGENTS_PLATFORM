import axios from "axios";

// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_URL,
// });

const api = axios.create({
    baseURL: "/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url ?? "";
            const isAuthEndpoint =
                url.includes("/auth/jwt/login") || url.includes("/auth/register");
            const onPublicPage =
                window.location.pathname === "/login" ||
                window.location.pathname === "/register";

            if (!isAuthEndpoint && !onPublicPage) {
                localStorage.removeItem("token");
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;