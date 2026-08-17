import { useEffect, useState } from "react";
import { AlertTriangle, Sparkles, RefreshCw, Activity } from "lucide-react";
import api, { fmtMoney } from "../lib/api";
import { Card, Button, Badge } from "../components/ui";
import EmailDraftModal from "../components/EmailDraftModal";
import { toast } from "sonner";

export default function AtRisk() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftDeal, setDraftDeal] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explaining, setExplaining] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      await api.post("/deals/refresh-scores");
      const { data } = await api.get("/deals/at-risk");
      setDeals(data.data);
    } catch { toast.error("Failed to load at-risk deals"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const explain = async (deal) => {
    setExplaining(deal.id);
    try {
      const { data } = await api.post(`/deals/${deal.id}/explain`);
      setExplanations((e) => ({ ...e, [deal.id]: data.data.explanation }));
    } catch { toast.error("Failed to explain"); }
    finally { setExplaining(null); }
  };

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle size={22} className="text-red-400" /> At-risk deals
          </h1>
          <p className="text-sm text-slate-400">Deals with churn score ≥ 70% — act before they slip away</p>
        </div>
        <Button variant="ghost" onClick={load} testid="refresh-at-risk-btn"><RefreshCw size={15} /> Recalculate</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : deals.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-slate-300 font-medium">No deals at risk</p>
          <p className="text-sm text-slate-500">Your pipeline is healthy.</p>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="at-risk-deals-table">
          {deals.map((d) => (
            <Card key={d.id} className="p-5" data-testid={`at-risk-row-${d.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{d.title}</span>
                    <Badge color="red">{Math.round(d.churn_score * 100)}% churn</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span>{fmtMoney(d.value)}</span>
                    <span className="flex items-center gap-1"><Activity size={12} /> {d.days_in_stage}d in stage</span>
                    <span>{d.probability}% win</span>
                  </div>
                  {explanations[d.id] && (
                    <div className="text-sm text-slate-300 bg-slate-800/50 border border-slate-700 rounded-lg p-3 fade-up">
                      <Sparkles size={13} className="inline text-indigo-400 mr-1" /> {explanations[d.id]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => explain(d)} disabled={explaining === d.id} testid={`explain-${d.id}`}>
                    {explaining === d.id ? "Thinking…" : <><Sparkles size={13} /> Why at risk?</>}
                  </Button>
                  <Button className="px-3 py-1.5 text-xs" onClick={() => setDraftDeal(d)} testid={`recover-${d.id}`}>
                    <Sparkles size={13} /> Draft recovery
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {draftDeal && <EmailDraftModal deal={draftDeal} onClose={() => setDraftDeal(null)} />}
    </div>
  );
}
