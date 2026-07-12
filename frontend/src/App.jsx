import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Footer from './Footer.jsx'

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <div className="app">

            <BrowserRouter>

                <Navbar />

                <main>

                    <Routes>

                        <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route
                                    path="/chat"
                                    element={
                                        <ProtectedRoute>
                                            <Chat />
                                        </ProtectedRoute>
                                    }
                                />

                    </Routes>

                </main>

            </BrowserRouter>

            <Footer />

        </div>
    );
}

export default App;