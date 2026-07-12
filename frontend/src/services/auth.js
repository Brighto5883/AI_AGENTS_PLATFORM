import api from "../api/axios";

// Register
export const registerUser = async (email, password) => {

    return await api.post("/auth/register", {
        email,
        password,
    });

};

// Login
export const loginUser = async (email, password) => {

    const form = new URLSearchParams();

    form.append("username", email);
    form.append("password", password);

    return await api.post(
        "/auth/jwt/login",
        form,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

};