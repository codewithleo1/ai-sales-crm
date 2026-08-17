import { useEffect, useState } from "react";
import { Check, Zap, CreditCard } from "lucide-react";
import api, { apiError } from "../lib/api";
import { Card, Button, Badge } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const FEATURES = {
  free: ["2 team seats", "50 AI credits / mo", "Up to 100 deals", "Community support"],
  pro: ["10 team seats", "1,000 AI credits / mo", "Up to 5,000 deals", "Priority support", "Churn prediction"],
  enterprise: ["100 team seats", "50,000 AI credits / mo", "Unlimited deals", "Dedicated CSM", "SSO & audit logs"],
};

function UsageBar({ label, used, limit }) {
  const pct = Math.min(100, Math.round((used / (limit || 1)) * 100));
  const color = pct > 85 ? "#EF4444" : pct > 60 ? "#F59E0B" : "#6366F1";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{used} / {limit}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Billing() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState({});
  const [usage, setUsage] = useState(null);
  const [annual, setAnnual] = useState(false);
  const isAdmin = ["owner", "admin"].includes(user?.role);

  const load = async () => {
    const [p, u] = await Promise.all([api.get("/billing/plans"), api.get("/billing/usage")]);
    setPlans(p.data.data);
    setUsage(u.data.data);
  };
  useEffect(() => { load(); }, []);

  const upgrade = async (plan) => {
    try {
      await api.post("/billing/upgrade", { plan });
      toast.success(`Switched to ${plans[plan].name} plan`);
      await load();
      await refreshUser();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const current = usage?.plan;

  return (
    <div className="fade-up" data-testid="subscription-billing-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard size={22} className="text-indigo-400" /> Billing & plans</h1>
          <p className="text-sm text-slate-400">Manage your subscription and usage</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-lg p-1">
          <button onClick={() => setAnnual(false)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${!annual ? "bg-accent text-white" : "text-slate-400"}`} data-testid="billing-monthly">Monthly</button>
          <button onClick={() => setAnnual(true)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${annual ? "bg-accent text-white" : "text-slate-400"}`} data-testid="billing-annual">Annual <span className="text-emerald-400">-20%</span></button>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Current usage</h3>
            <Badge color="indigo">{plans[current]?.name} plan</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UsageBar label="Team seats" used={usage.usage.seats} limit={usage.limits.seats} />
            <UsageBar label="AI credits" used={usage.usage.ai_credits} limit={usage.limits.ai_credits} />
            <UsageBar label="Deals tracked" used={usage.usage.deals} limit={usage.limits.deals} />
          </div>
        </Card>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {["free", "pro", "enterprise"].map((key) => {
          const p = plans[key];
          if (!p) return null;
          const price = annual ? Math.round(p.price * 12 * 0.8) : p.price;
          const isCurrent = current === key;
          const featured = key === "pro";
          return (
            <Card key={key} className={`p-6 relative ${featured ? "border-accent/50 shadow-glow" : ""}`} data-testid={`plan-${key}`}>
              {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge color="indigo"><Zap size={11} className="mr-1" /> Most popular</Badge></div>}
              <div className="text-lg font-heading font-bold text-white mb-1">{p.name}</div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">${price}</span>
                <span className="text-sm text-slate-500">/{annual ? "yr" : "mo"}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {FEATURES[key].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? "ghost" : featured ? "primary" : "ghost"}
                className="w-full"
                disabled={isCurrent || !isAdmin}
                onClick={() => upgrade(key)}
                testid={`select-plan-${key}`}
              >
                {isCurrent ? "Current plan" : `Choose ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-slate-600 mt-4">
        Payments are simulated in this build. Live Stripe checkout is on the Phase-2 roadmap.
      </p>
    </div>
  );
}
