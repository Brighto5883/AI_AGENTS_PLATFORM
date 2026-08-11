import { useNavigate } from "react-router-dom";
import "../styling/Home.css";

function Home() {

    const navigate = useNavigate();

    return (

        <div className="homepage">

            <h1 className="homepage-title">
                Brightone AI Labs
            </h1>

            <p className="introparagraph">
                AI Agents for assistance and simplification of your daily tasks.
            </p>

            <div className="homepage-buttons">

                <button
                    className="btn-primary"
                    onClick={() => navigate("/login")}
                >
                    Login
                </button>

                <button
                    className="btn-secondary"
                    onClick={() => navigate("/register")}
                >
                    Register
                </button>

            </div>

        </div>

    );

}

export default Home;