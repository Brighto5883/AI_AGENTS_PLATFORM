import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { register, resetPassword } from "@/services/apiServices";

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">✦</span>
          <span>Campus Hub</span>
        </Link>

        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>

        {children}
      </div>
    </main>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (!pw) {
      setError("Password is required.");
      return;
    }

    setBusy(true);

    try {
      await login(email.trim(), pw);
      nav("/home", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Campus Hub workspace."
    >
      <form onSubmit={submit}>
        <label className="field">
          <span>Email</span>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            type="email"
          />
        </label>

        <label className="field">
          <span>Password</span>

          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            type="password"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="button dark full" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/forgot-password">Forgot password?</Link>

        <span>
          New here? <Link to="/register">Create account</Link>
        </span>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);

    try {
      await register(email.trim(), pw, phone.trim() || undefined);
      nav("/login", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start using the campus workspace today."
    >
      <form onSubmit={submit}>
        <label className="field">
          <span>Email</span>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            type="email"
          />
        </label>

        <label className="field">
          <span>Password</span>

          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
            type="password"
          />

          <small>At least 8 characters.</small>
        </label>

        <label className="field">
          <span>
            Phone number <small>(optional)</small>
          </span>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="button dark full" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="auth-links">
        <span>
          Already have an account? <Link to="/login">Log in</Link>
        </span>
      </div>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (pw !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      await resetPassword(email.trim(), pw);
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Password reset failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={done ? "Password updated" : "Reset password"}
      subtitle={
        done
          ? "You can now log in with your new password."
          : "Set a new password for your account."
      }
    >
      {done ? (
        <button
          className="button dark full"
          onClick={() => nav("/login")}
        >
          Back to login
        </button>
      ) : (
        <form onSubmit={submit}>
          <label className="field">
            <span>Email</span>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span>New password</span>

            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Confirm password</span>

            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="button dark full" disabled={busy}>
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}