import { Link, useNavigate } from "react-router-dom";
import '../styling/Navbar.css';

function Navbar() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <nav className="navbar">

            <div className="navbar-logo">
                <h2>Road Design Agent</h2>
            </div>

            <div className="navbar-links">

                <Link to="/">Home</Link>

                {!token && (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}

                {token && (
                    <>
                        <Link to="/chat">Chat</Link>

                        <button
                            className="btn btn-danger"
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </>
                )}

            </div>

        </nav>
    );
}

export default Navbar;