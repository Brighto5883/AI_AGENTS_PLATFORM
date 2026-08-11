import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import services from "../config/services";
import { canAccessService } from "../utils/access";
import "../styling/Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentUserPlan = "free";

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Link to="/dashboard" className="sidebar-home" onClick={() => setOpen(false)}>
          <h3>AI Agents Platform</h3>
        </Link>

        <nav className="sidebar-links">
          {services.map((service) => {
            const unlocked = canAccessService(service, currentUserPlan);
            return unlocked ? (
              <Link
                key={service.id}
                to={service.path}
                className="sidebar-link"
                onClick={() => setOpen(false)}
              >
                {service.name}
              </Link>
            ) : (
              <span key={service.id} className="sidebar-link disabled">
                {service.name}
              </span>
            );
          })}
        </nav>

        <button className="btn btn-danger sidebar-logout" onClick={logout}>
          Logout
        </button>
      </aside>
    </>
  );
}