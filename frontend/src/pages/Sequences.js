import { useEffect, useState } from "react";
import { Mailbox, Plus, Sparkles, Send, Clock, Check, Trash2, ChevronDown } from "lucide-react";
import api, { apiError, fmtMoney } from "../lib/api";
import { Card, Button, Badge, Modal } from "../components/ui";
import { toast } from "sonner";

const STEP_COLOR = { pending: "slate", drafted: "indigo", sent: "green" };

function NewSequenceModal({ onClose, onCreated }) {
  const [deals, setDeals] = useState([]);
  const [dealId, setDealId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/deals", { params: { page_size: 2000 } }).then((r) => {
      const stalled = r.data.data
        .filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
        .sort((a, b) => (b.churn_score || 0) - (a.churn_score || 0));
      setDeals(stalled);
      setDealId(stalled[0]?.id || "");
    });
  }, []);

  const create = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const { data } = await api.post("/sequences", { deal_id: dealId });
      toast.success("Sequence created & first email drafted");
      onCreated(data.data);
      onClose();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="New follow-up sequence" testid="new-sequence-modal">
      <p className="text-sm text-slate-400 mb-4">Pick a stalled deal. We'll build a 3-step cadence and auto-draft the first email with AI.</p>
      <label className="block mb-4">
        <span className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Deal (sorted by churn risk)</span>
        <select value={dealId} onChange={(e) => setDealId(e.target.value)} data-testid="sequence-deal-select"
          className="w-full bg-ink border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm">
          {deals.map((d) => (
            <option key={d.id} value={d.id}>{d.title} · {fmtMoney(d.value)} · churn {Math.round((d.churn_score || 0) * 100)}%</option>
          ))}
        </select>
      </label>
      <Button onClick={create} disabled={loading || !dealId} className="w-full" testid="create-sequence-btn">
        {loading ? "Drafting…" : <><Sparkles size={15} /> Create & draft</>}
      </Button>
    </Modal>
  );
}

function Step({ seq, step, onChanged }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const act = async (kind) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/sequences/${seq.id}/steps/${step.step_no}/${kind}`);
      onChanged(data.data);
      toast.success(kind === "draft" ? "Draft ready" : "Marked as sent");
      if (kind === "draft") setOpen(true);
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40" data-testid={`step-${seq.id}-${step.step_no}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">{step.step_no}</div>
          <div>
            <div className="text-sm font-medium text-white flex items-center gap-1.5"><Clock size={12} className="text-slate-500" /> Day {step.offset_days} · <span className="capitalize text-slate-400">{step.tone}</span></div>
            {step.subject && <div className="text-xs text-slate-500 truncate max-w-md">{step.subject}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={STEP_COLOR[step.status]}>{step.status}</Badge>
          {step.status === "pending" && (
            <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => act("draft")} disabled={busy} testid={`draft-step-${step.step_no}`}>
              <Sparkles size={12} /> {busy ? "…" : "Draft"}
            </Button>
          )}
          {step.status === "drafted" && (
            <>
              <button onClick={() => setOpen((o) => !o)} className="text-slate-400 hover:text-white" data-testid={`view-step-${step.step_no}`}>
                <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              <Button className="px-2.5 py-1.5 text-xs" onClick={() => act("send")} disabled={busy} testid={`send-step-${step.step_no}`}>
                <Send size={12} /> Send
              </Button>
            </>
          )}
          {step.status === "sent" && <Check size={16} className="text-emerald-400" />}
        </div>
      </div>
      {open && step.body && (
        <div className="px-4 pb-4 fade-up">
          <div className="text-xs text-slate-500 mb-1">Subject: <span className="text-slate-300">{step.subject}</span></div>
          <div className="bg-ink border border-slate-700 rounded-lg p-3 text-sm text-slate-300 whitespace-pre-line">{step.body}</div>
        </div>
      )}
    </div>
  );
}

export default function Sequences() {
  const [seqs, setSeqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/sequences"); setSeqs(data.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateSeq = (updated) => setSeqs((s) => s.map((x) => (x.id === updated.id ? updated : x)));

  const remove = async (id) => {
    try { await api.delete(`/sequences/${id}`); setSeqs((s) => s.filter((x) => x.id !== id)); toast.success("Sequence deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Mailbox size={22} className="text-indigo-400" /> Email sequences</h1>
          <p className="text-sm text-slate-400">Multi-step AI cadences that re-engage stalled deals</p>
        </div>
        <Button onClick={() => setShowNew(true)} testid="new-sequence-button"><Plus size={15} /> New sequence</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
      ) : seqs.length === 0 ? (
        <Card className="p-10 text-center" data-testid="sequences-empty">
          <Mailbox size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-300 font-medium">No sequences yet</p>
          <p className="text-sm text-slate-500 mb-4">Create an AI cadence to automatically re-engage a stalled deal.</p>
          <Button onClick={() => setShowNew(true)} testid="new-sequence-empty-btn"><Plus size={15} /> New sequence</Button>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="sequences-list">
          {seqs.map((seq) => {
            const done = seq.steps.filter((s) => s.status === "sent").length;
            return (
              <Card key={seq.id} className="p-5" data-testid={`sequence-${seq.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-medium text-white">{seq.deal_title}</div>
                    <div className="text-xs text-slate-500">{fmtMoney(seq.deal_value)} · to {seq.contact_email || "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={seq.status === "completed" ? "green" : "indigo"}>{done}/{seq.steps.length} sent</Badge>
                    <button onClick={() => remove(seq.id)} className="text-slate-600 hover:text-red-400" data-testid={`delete-sequence-${seq.id}`}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  {seq.steps.map((step) => <Step key={step.step_no} seq={seq} step={step} onChanged={updateSeq} />)}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showNew && <NewSequenceModal onClose={() => setShowNew(false)} onCreated={(s) => setSeqs((cur) => [s, ...cur])} />}
    </div>
  );
}
