import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, Zap, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Input, Button } from "../components/ui";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@aisalescrm.com");
  const [password, setPassword] = useState("Demo1234!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
    } else {
      toast.success("Welcome back!");
    }
  };

  return (
    <div className="app-bg min-h-screen grid lg:grid-cols-2">
      {/* Left visual */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-slate-800/80 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
            <Sparkles size={19} className="text-white" />
          </div>
          <span className="font-heading font-bold text-lg">Northwind CRM</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            Close more deals with an <span className="text-indigo-400">AI copilot</span> for your pipeline.
          </h1>
          <p className="text-slate-400 mb-8">
            Predict churn before it happens, score every lead, and draft winning follow-ups in one click.
          </p>
          <div className="space-y-4">
            {[
              { icon: TrendingUp, t: "Churn prediction", d: "Know which deals are slipping away." },
              { icon: Zap, t: "AI email drafting", d: "Personalized follow-ups in seconds." },
              { icon: ShieldCheck, t: "Multi-tenant & secure", d: "Team roles and workspace isolation." },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0">
                  <f.icon size={17} className="text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-white">{f.t}</div>
                  <div className="text-sm text-slate-400">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-600">Powered by Groq · Qwen3</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm fade-up" data-testid="auth-login-card">
          <h2 className="text-2xl font-bold mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-6">Welcome back. Let's get to work.</p>

          <form onSubmit={submit}>
            <Input label="Email" type="email" value={email} testid="login-email"
              onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            <Input label="Password" type="password" value={password} testid="login-password"
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <div className="text-sm text-red-400 mb-3" data-testid="login-error">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full" testid="login-submit">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-400">
            <span className="text-slate-300 font-medium">Demo account</span> · demo@aisalescrm.com / Demo1234!
          </div>

          <p className="text-sm text-slate-400 mt-6 text-center">
            No account?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium" data-testid="go-register">
              Create a workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
