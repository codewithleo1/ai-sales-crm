import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, KanbanSquare, AlertTriangle, Users, UserCog,
  CreditCard, Settings, LogOut, Sparkles, Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare, testid: "nav-pipeline" },
  { to: "/at-risk", label: "At-Risk", icon: AlertTriangle, testid: "nav-at-risk" },
  { to: "/contacts", label: "Contacts", icon: Users, testid: "nav-contacts" },
  { to: "/team", label: "Team", icon: UserCog, testid: "nav-team" },
  { to: "/billing", label: "Billing", icon: CreditCard, testid: "nav-billing" },
  { to: "/settings", label: "Settings", icon: Settings, testid: "nav-settings" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const org = user?.organization;

  return (
    <div className="app-bg min-h-screen flex text-slate-200">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-800/80 bg-ink/60 backdrop-blur-xl flex flex-col fixed h-screen">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-800/80">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
            <Sparkles size={17} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-bold text-sm text-white">Northwind</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">AI Sales CRM</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={n.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-accent/15 text-white border border-accent/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                }`
              }
            >
              <n.icon size={17} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <Avatar name={user?.name || "U"} size={34} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-[11px] text-slate-500 capitalize">{user?.role}</div>
            </div>
            <button
              onClick={async () => { await logout(); navigate("/login"); }}
              data-testid="logout-btn"
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <header className="h-16 sticky top-0 z-30 border-b border-slate-800/80 bg-ink/70 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2 w-72">
              <Search size={15} className="text-slate-500" />
              <input
                placeholder="Search deals, contacts…"
                data-testid="global-search-input"
                className="bg-transparent text-sm outline-none flex-1 placeholder-slate-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              data-testid="workspace-switcher-dropdown"
              className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <div className="h-5 w-5 rounded bg-gradient-to-br from-indigo-500 to-violet-500" />
              <span className="font-medium text-white">{org?.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                {org?.plan}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
