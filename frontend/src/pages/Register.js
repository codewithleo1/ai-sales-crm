import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Input, Button } from "../components/ui";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", org_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
    } else {
      toast.success("Workspace created!");
    }
  };

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm fade-up" data-testid="auth-register-card">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
            <Sparkles size={19} className="text-white" />
          </div>
          <span className="font-heading font-bold text-lg">Northwind CRM</span>
        </div>

        <h2 className="text-2xl font-bold mb-1">Create your workspace</h2>
        <p className="text-slate-400 text-sm mb-6">Start your AI-powered sales pipeline in seconds.</p>

        <form onSubmit={submit}>
          <Input label="Your name" value={form.name} onChange={set("name")} testid="register-name" placeholder="Jane Doe" required />
          <Input label="Workspace name" value={form.org_name} onChange={set("org_name")} testid="register-org" placeholder="Acme Inc" />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} testid="register-email" placeholder="you@company.com" required />
          <Input label="Password" type="password" value={form.password} onChange={set("password")} testid="register-password" placeholder="At least 6 characters" required minLength={6} />
          {error && <div className="text-sm text-red-400 mb-3" data-testid="register-error">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full" testid="register-submit">
            {loading ? "Creating…" : "Create workspace"}
          </Button>
        </form>

        <p className="text-sm text-slate-400 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium" data-testid="go-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
