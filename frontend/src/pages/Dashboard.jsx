import { Link } from "react-router-dom";
import services from "../config/services";
import { canAccessService } from "../utils/access";
import "../styling/Dashboard.css";

export default function AgentHub() {
  const currentUserPlan = "free"; //TO DO: replace with real plan once /users/me exposes it

  return (
    <div className="dashboard-grid">

      {services.map((service) => {
        const unlocked = canAccessService(service, currentUserPlan);
        const comingSoon = service.status === "coming-soon";

        const card = (
          <div
            className={`service-card ${unlocked ? "" : "service-card-locked"}`}
          >

            <div className="service-icon">
              <svg width="32" height="32">
                <use href={`/icons.svg#${service.icon}`} />
              </svg>
            </div>

            <h3>{service.name}</h3>
            <p>{service.description}</p>
            {comingSoon && <span className="service-badge">Coming soon</span>}
            {!comingSoon && !unlocked && (
              <span className="service-badge">Upgrade required</span>
            )}

          </div>
        );

        return unlocked ? (
          <Link key={service.id} to={service.path} className="service-card-link">
            {card}
          </Link>
        ) : (
          <div key={service.id} className="service-card-link disabled">
            {card}
          </div>
        );
      })}
    </div>
  );
}
