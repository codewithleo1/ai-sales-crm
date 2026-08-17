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

  const upgrade = async (plan) => changePlan(plan);

  const current = usage?.plan;

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const changePlan = async (key) => {
    // Free = direct downgrade, no payment
    if (plans[key]?.price === 0) {
      try {
        await api.post("/billing/upgrade", { plan: key });
        toast.success("Switched to Free plan");
        await load(); await refreshUser();
      } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
      return;
    }
    // Paid = Razorpay checkout
    const ok = await loadRazorpay();
    if (!ok) return toast.error("Could not load Razorpay checkout");
    let order;
    try {
      const { data } = await api.post("/billing/razorpay/order", { plan: key, annual });
      order = data.data;
    } catch (e) { return toast.error(apiError(e.response?.data?.detail)); }

    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Northwind CRM",
      description: `${plans[key].name} plan`,
      prefill: { name: user?.name, email: user?.email },
      theme: { color: "#6366F1" },
      handler: async (resp) => {
        try {
          await api.post("/billing/razorpay/verify", {
            plan: key,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          toast.success(`Upgraded to ${plans[key].name}! 🎉`);
          await load(); await refreshUser();
        } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
      },
      modal: { ondismiss: () => toast.message("Checkout cancelled") },
    });
    rzp.open();
  };

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
        Secure checkout via Razorpay (test mode). Use test card 4111 1111 1111 1111, any future expiry & CVV.
      </p>
    </div>
  );
}
