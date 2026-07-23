/**
 * Settings page — app configuration and info.
 */
import { Bot, Database, Mail, Zap, Globe, Github } from 'lucide-react'

const STACK = [
  { icon: Zap, label: 'AI Model', value: 'Groq — llama-3.1-8b-instant', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { icon: Database, label: 'Database', value: 'Supabase PostgreSQL', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: Mail, label: 'Email', value: 'Resend — free tier (100/day)', color: 'text-amber-500', bg: 'bg-amber-50' },
  { icon: Globe, label: 'Frontend', value: 'Vercel — auto deploys from GitHub', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Bot, label: 'Backend', value: 'Render — free tier', color: 'text-purple-500', bg: 'bg-purple-50' },
]

export default function Settings() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-14 bg-white border-b border-gray-100 flex items-center px-6">
        <h1 className="text-gray-900 font-semibold text-base">Settings</h1>
      </div>

      <div className="p-6 flex flex-col gap-6 max-w-2xl">

        {/* App Info */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-sm">AI Sales CRM</h2>
              <p className="text-gray-400 text-xs">v1.0.0 — Portfolio Project</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            An AI-powered CRM that analyzes your sales pipeline, predicts churn,
            drafts personalized follow-up emails, and delivers them — powered by
            Groq LLaMA 3.
          </p>
        </div>

        {/* Stack */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-gray-900 font-semibold text-sm mb-4">Tech Stack</h2>
          <div className="flex flex-col gap-3">
            {STACK.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon size={14} className={color} />
                </div>
                <div>
                  <p className="text-gray-900 text-xs font-medium">{label}</p>
                  <p className="text-gray-400 text-xs">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-gray-900 font-semibold text-sm mb-4">Links</h2>
          <div className="flex flex-col gap-3">
            
              href="https://github.com/codewithleo1/ai-sales-crm"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Github size={14} className="text-gray-600" />
              <span className="text-gray-700 text-xs font-medium">GitHub Repository</span>
            </a>
            
              href="https://ai-sales-crm-ehv0.onrender.com/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Globe size={14} className="text-gray-600" />
              <span className="text-gray-700 text-xs font-medium">API Documentation (Swagger)</span>
            </a>
          </div>
        </div>

        {/* Free tier note */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-amber-700 text-xs leading-relaxed">
            <span className="font-semibold">Note:</span> This app runs entirely on free tiers.
            The backend (Render) may take 30–50 seconds to wake up on first load.
            The database (Supabase) pauses after 1 week of inactivity — unpause before demoing.
          </p>
        </div>

      </div>
    </div>
  )
}