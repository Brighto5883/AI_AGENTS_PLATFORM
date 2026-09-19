import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const nav = [
  ["Home", "/home"], ["Marketplace", "/marketplace"], ["Road Agent", "/agents/road"], ["WhatsApp", "/agents/whatsapp"], ["Account", "/account"],
] as const;

export function AppLayout() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/home" className="brand"><span className="brand-mark">✦</span><span>Campus Hub</span></Link>
      <nav className="desktop-nav">{nav.map(([label, path]) => <NavLink key={path} to={path} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>{label}</NavLink>)}</nav>
      <div className="top-actions"><span className="user-pill">{user?.email}</span><button className="button ghost small" onClick={() => { logout(); navigate("/"); }}>Log out</button></div>
    </header>
    <main className="main-content"><Outlet /></main>
    <footer className="footer"><span>Campus Hub</span><span>AI-powered campus services, all in one place.</span></footer>
  </div>;
}

export function PublicLayout() { return <><header className="public-topbar"><Link to="/" className="brand"><span className="brand-mark">✦</span><span>Campus Hub</span></Link><div><Link className="button ghost small" to="/login">Log in</Link><Link className="button primary small" to="/register">Create account</Link></div></header><Outlet /></>; }

export function Page({ children, title, eyebrow, action }: { children: React.ReactNode; title: string; eyebrow?: string; action?: React.ReactNode }) {
  return <section className="page"><div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1></div>{action}</div>{children}</section>;
}
