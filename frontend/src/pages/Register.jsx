import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth";
import "../styling/Auth.css";

function Register() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async () => {

        if (!email || !password) {

            setMessage("Please enter both an email and password.");

            return;

        }

        try {

            await registerUser(email, password);

            setMessage("Registration successful! Redirecting to login...");

            setEmail("");
            setPassword("");

            setTimeout(() => {

                navigate("/login");

            }, 1000);

        }

        catch (error) {

            if (error.response?.data?.detail) {

                if (Array.isArray(error.response.data.detail)) {

                    setMessage(error.response.data.detail[0].msg);

                }

                else {

                    setMessage(error.response.data.detail);

                }

            }

            else {

                setMessage("Registration failed.");

            }

        }

    };

    return (

        <div className="auth-container">

            <div className="auth-card">

                <h2>Create Account</h2>

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
                    onClick={handleRegister}
                >
                    Register
                </button>

                <p className="message">{message}</p>

            </div>

        </div>

    );

}

export default Register;