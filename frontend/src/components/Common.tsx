import { Link } from "react-router-dom";

export function Loading({ label = "Loading..." }: { label?: string }) { return <div className="state-card"><div className="spinner"/><p>{label}</p></div>; }
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) { return <div className="state-card error-state"><strong>Something went wrong</strong><p>{message}</p>{onRetry && <button className="button dark" onClick={onRetry}>Try again</button>}</div>; }
export function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) { return <div className="empty"><div className="empty-icon">○</div><h3>{title}</h3><p>{text}</p>{action}</div>; }
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></div>{children}</div></div>; }
export function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function ActionLink({ to, children }: { to: string; children: React.ReactNode }) { return <Link className="button dark" to={to}>{children}</Link>; }
