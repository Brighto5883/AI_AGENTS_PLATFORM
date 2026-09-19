import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Landing() {
  const { user } = useAuth();

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">THE CAMPUS WORKSPACE</div>

          <h1>
            Get things done.
            <br />
            <em>On campus.</em>
          </h1>

          <p>
            Campus Hub brings AI-powered services, a student marketplace and
            practical campus tools into one focused workspace.
          </p>

          <div className="hero-actions">
            {user ? (
              <Link className="button primary large" to="/home">
                Open Campus Hub →
              </Link>
            ) : (
              <>
                <Link className="button primary large" to="/register">
                  Create your account
                </Link>

                <Link className="button ghost large" to="/login">
                  Log in
                </Link>
              </>
            )}
          </div>

          <div className="hero-note">
            Built for students and campus communities.
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-top">
            <span>Campus Hub</span>
            <span className="status-dot">● Live workspace</span>
          </div>

          <div className="mock-title">
            Everything you need,
            <br />
            <strong>one place.</strong>
          </div>

          <div className="mock-grid">
            <div>
              <b>🛍</b>
              <span>Marketplace</span>
              <small>Buy, sell & connect</small>
            </div>

            <div>
              <b>✦</b>
              <span>AI Agents</span>
              <small>Work faster</small>
            </div>

            <div>
              <b>▱</b>
              <span>Road Agent</span>
              <small>Engineering support</small>
            </div>

            <div>
              <b>◉</b>
              <span>WhatsApp</span>
              <small>Draft & review</small>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <div>
          <span>01</span>
          <h2>One campus workspace</h2>
          <p>
            Move between services without juggling separate tools.
          </p>
        </div>

        <div>
          <span>02</span>
          <h2>Useful AI assistance</h2>
          <p>
            Ask agents to help with specialized campus and engineering
            workflows.
          </p>
        </div>

        <div>
          <span>03</span>
          <h2>Real student connections</h2>
          <p>
            Find items, services and opportunities within the community.
          </p>
        </div>
      </section>
    </main>
  );
}