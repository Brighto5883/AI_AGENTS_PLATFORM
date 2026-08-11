import { useState } from "react";
import { loginUser } from "../services/auth";
import { useNavigate } from "react-router-dom";
import "../styling/Auth.css";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {

        try {

            const response = await loginUser(email, password);

            localStorage.setItem(
                "token",
                response.data.access_token
            );

            setMessage("Login successful!");

            navigate("/dashboard");

        } catch (error) {

            setMessage("Invalid email or password.");
            setError(error.response?.data?.detail || "");

        }

    };

    return (

        <div className="auth-container">

            <div className="auth-card">

                <h2>Login</h2>

                <input
                    className="auth-input"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="auth-input"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    className="btn-primary"
                    onClick={handleLogin}
                >
                    Login
                </button>

                <p className="message">{message}</p>

                <p className="error">{error}</p>

            </div>

        </div>

    );

}

export default Login;