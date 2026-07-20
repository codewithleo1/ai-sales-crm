import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Users,
  Settings,
  Bot,
} from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pipeline', label: 'Pipeline', icon: TrendingUp },
  { to: '/at-risk', label: 'At Risk', icon: AlertTriangle },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col" style={{background: 'linear-gradient(160deg, #4f46e5 0%, #7c3aed 100%)'}}>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Bot size={14} className="text-white" />
        </div>
        <span className="font-semibold text-white text-sm">AI Sales CRM</span>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/55 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4">
        <p className="text-xs text-white/30">Powered by Groq + LLaMA 3</p>
      </div>
    </aside>
  )
}