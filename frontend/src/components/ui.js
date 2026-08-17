import { clsx } from "clsx";

export function Badge({ children, color = "slate", className }) {
  const map = {
    slate: "bg-slate-700/40 text-slate-300 border-slate-600/50",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  };
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", map[color], className)}>
      {children}
    </span>
  );
}

export function Avatar({ name = "?", size = 32 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#6366F1", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
  const bg = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

export function Modal({ open, onClose, title, children, testid }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid={testid}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-slate-700 rounded-2xl shadow-2xl fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} data-testid="modal-close-btn" className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Input({ label, testid, ...props }) {
  return (
    <label className="block mb-4">
      {label && <span className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{label}</span>}
      <input
        data-testid={testid}
        {...props}
        className="w-full bg-ink border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
      />
    </label>
  );
}

export function Button({ children, variant = "primary", className, testid, ...props }) {
  const variants = {
    primary: "bg-accent hover:bg-accenthover text-white shadow-glow",
    ghost: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500/90 hover:bg-red-500 text-white",
  };
  return (
    <button
      {...props}
      data-testid={testid}
      className={clsx(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className, ...props }) {
  return (
    <div
      {...props}
      className={clsx(
        "bg-slate-900/70 border border-slate-800 rounded-2xl backdrop-blur-md transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
