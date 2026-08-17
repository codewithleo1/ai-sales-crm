import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
  PieChart, Pie,
} from "recharts";
import { DollarSign, TrendingUp, AlertTriangle, Users, Plus, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import api, { fmtMoney, STAGES } from "../lib/api";
import { Card, Button, Badge } from "../components/ui";
import EmailDraftModal from "../components/EmailDraftModal";
import AddDealModal from "../components/AddDealModal";
import { toast } from "sonner";

const KPI_META = [
  { key: "arr", label: "Closed Revenue", icon: DollarSign, color: "#10B981", money: true },
  { key: "total_pipeline", label: "Open Pipeline", icon: TrendingUp, color: "#6366F1", money: true },
  { key: "win_rate", label: "Win Rate", icon: TrendingUp, color: "#3B82F6", suffix: "%" },
  { key: "at_risk_count", label: "At-Risk Deals", icon: AlertTriangle, color: "#EF4444" },
];

function KpiCard({ meta, value }) {
  const display = meta.money ? fmtMoney(value) : `${value ?? 0}${meta.suffix || ""}`;
  return (
    <Card className="p-5 hover:border-slate-700" data-testid={`kpi-${meta.key}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{meta.label}</span>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}22` }}>
          <meta.icon size={16} style={{ color: meta.color }} />
        </div>
      </div>
      <div className="text-2xl font-bold font-heading text-white">{display}</div>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [atRisk, setAtRisk] = useState([]);
  const [insight, setInsight] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    const [s, r, i] = await Promise.all([
      api.get("/dashboard/stats"),
      api.get("/deals/at-risk"),
      api.get("/ai/insights"),
    ]);
    setStats(s.data.data);
    setAtRisk(r.data.data);
    setInsight(i.data.data[0] || null);
  };

  useEffect(() => { load().catch(() => toast.error("Failed to load dashboard")); }, []);

  const generateInsights = async () => {
    setGenLoading(true);
    try {
      const { data } = await api.post("/ai/insights/generate");
      setInsight(data.data);
      toast.success("Pipeline analyzed");
    } catch { toast.error("Analysis failed"); }
    finally { setGenLoading(false); }
  };

  const barData = stats
    ? STAGES.filter((s) => !s.key.startsWith("closed")).map((s) => ({
        name: s.label, value: stats.stage_values?.[s.key] || 0, color: s.color,
      }))
    : [];

  const pieData = stats
    ? [
        { name: "Won", value: stats.won_count || 0, color: "#10B981" },
        { name: "Lost", value: (stats.total_deals || 0) - (stats.active_deals || 0) - (stats.won_count || 0), color: "#EF4444" },
        { name: "Open", value: stats.active_deals || 0, color: "#6366F1" },
      ]
    : [];

  return (
    <div data-testid="dashboard-analytics-grid" className="fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">Your pipeline at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => load()} testid="refresh-dashboard-btn"><RefreshCw size={15} /> Refresh</Button>
          <Button onClick={() => setShowAdd(true)} testid="add-deal-button"><Plus size={15} /> Add deal</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats
          ? KPI_META.map((m) => <KpiCard key={m.key} meta={m} value={stats[m.key]} />)
          : Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-semibold text-white mb-4">Pipeline value by stage</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtMoney} />
              <Tooltip cursor={{ fill: "rgba(99,102,241,0.08)" }}
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 10, color: "#fff" }}
                formatter={(v) => fmtMoney(v)} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-white mb-4">Deal outcomes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* At-risk + AI insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5" data-testid="at-risk-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" /> At-risk deals
            </h3>
            <Badge color="red">{atRisk.length}</Badge>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {atRisk.length === 0 && <p className="text-sm text-slate-500">No deals at risk. 🎉</p>}
            {atRisk.slice(0, 6).map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{d.title}</div>
                  <div className="text-xs text-slate-500">{fmtMoney(d.value)} · churn {Math.round(d.churn_score * 100)}%</div>
                </div>
                <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => setSelectedDeal(d)} testid={`draft-email-${d.id}`}>
                  <Sparkles size={13} /> Draft
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5" data-testid="ai-insights-feed">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> AI pipeline insights
            </h3>
            <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={generateInsights} disabled={genLoading} testid="generate-insights-btn">
              {genLoading ? "Analyzing…" : <>Analyze <ArrowRight size={13} /></>}
            </Button>
          </div>
          {genLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-4 rounded w-full" />
              <div className="skeleton h-4 rounded w-4/5" />
              <div className="skeleton h-4 rounded w-3/5" />
            </div>
          ) : insight ? (
            <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{insight.content}</div>
          ) : (
            <p className="text-sm text-slate-500">Click <span className="text-indigo-300">Analyze</span> to let Qwen3 surface risks and opportunities across your pipeline.</p>
          )}
        </Card>
      </div>

      {selectedDeal && <EmailDraftModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />}
      {showAdd && <AddDealModal onClose={() => setShowAdd(false)} onCreated={() => load()} />}
    </div>
  );
}
