import { useNavigate } from "react-router-dom";
import "../styling/Home.css";

function Home() {

    const navigate = useNavigate();

    return (

        <div className="homepage">

            <h1 className="homepage-title">
                Road Design Agent
            </h1>

            <p className="introparagraph">
                AI Assistant for Kenyan Road Design, Highway Engineering and Construction Specifications.
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