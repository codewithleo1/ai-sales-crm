import { useEffect, useState } from "react";
import { Bot, Play, Check, X, Eye, Sparkles, RefreshCw, Clock, Send } from "lucide-react";
import api, { fmtMoney, apiError } from "../lib/api";
import { Card, Button, Badge } from "../components/ui";
import { toast } from "sonner";

const BOUNDARY_COLOR = { autonomous: "green", approval: "amber", observed: "slate" };
const STATUS_COLOR = {
  pending: "amber", sent: "green", sent_demo: "blue",
  approved: "green", approved_demo: "blue", rejected: "red", observed: "slate",
};

function ActionCard({ action, onApprove, onReject, loading }) {
  const [expanded, setExpanded] = useState(false);
  const isPending = action.status === "pending";

  return (
    <Card className="p-5" data-testid={`agent-action-${action.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-white">{action.deal_title}</span>
            <Badge color={BOUNDARY_COLOR[action.boundary]}>{action.boundary}</Badge>
            <Badge color={STATUS_COLOR[action.status]}>{action.status}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
            <span>{fmtMoney(action.deal_value)}</span>
            <span className="capitalize">{action.deal_stage}</span>
            <span>churn {Math.round((action.churn_score || 0) * 100)}%</span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {new Date(action.created_at).toLocaleString()}
            </span>
          </div>
          {action.explanation && (
            <p className="text-sm text-slate-300 mb-2">
              <Sparkles size={12} className="inline text-indigo-400 mr-1" />
              {action.explanation}
            </p>
          )}
          {action.draft_subject && (
            <div className="text-xs text-slate-500">
              Subject: <span className="text-slate-300">{action.draft_subject}</span>
              {action.to_email && <span className="ml-2">→ {action.to_email}</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {isPending && (
            <>
              <Button
                className="px-3 py-1.5 text-xs"
                onClick={() => onApprove(action.id)}
                disabled={loading === action.id}
                testid={`approve-${action.id}`}
              >
                <Check size={13} /> Approve & Send
              </Button>
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs"
                onClick={() => onReject(action.id)}
                disabled={loading === action.id}
                testid={`reject-${action.id}`}
              >
                <X size={13} /> Reject
              </Button>
            </>
          )}
          {action.draft_body && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
              data-testid={`expand-${action.id}`}
            >
              <Eye size={12} /> {expanded ? "Hide" : "Preview"}
            </button>
          )}
        </div>
      </div>

      {expanded && action.draft_body && (
        <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 whitespace-pre-line fade-up">
          {action.draft_body}
        </div>
      )}
    </Card>
  );
}

export default function AgentInbox() {
  const [inbox, setInbox] = useState({ pending: [], recent: [] });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/agent/inbox");
      setInbox(data.data);
    } catch {
      toast.error("Failed to load agent inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runAgent = async () => {
    setRunning(true);
    try {
      const { data } = await api.post("/agent/run");
      const s = data.data;
      toast.success(
        `Agent ran — ${s.autonomous} sent autonomously, ${s.pending_approval} need approval`
      );
      await load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    } finally {
      setRunning(false);
    }
  };

  const approve = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/agent/approve/${id}`);
      toast.success("Approved — email sent");
      await load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/agent/reject/${id}`);
      toast.success("Action rejected");
      await load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    } finally {
      setActionLoading(null);
    }
  };

  const totalPending = inbox.pending.length;

  return (
    <div className="fade-up" data-testid="agent-inbox-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot size={22} className="text-indigo-400" /> Agent Inbox
          </h1>
          <p className="text-sm text-slate-400">
            Human-in-the-loop AI actions — review, approve, or let the agent run autonomously
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={load} disabled={loading} testid="refresh-inbox-btn">
            <RefreshCw size={15} /> Refresh
          </Button>
          <Button onClick={runAgent} disabled={running} testid="run-agent-btn">
            <Play size={15} /> {running ? "Running…" : "Run Agent"}
          </Button>
        </div>
      </div>

      {/* Boundary legend */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Badge color="green">autonomous</Badge>
            <span>Lead / Contacted + value &lt; $50k — agent sends immediately</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="amber">approval</Badge>
            <span>Proposal stage or value ≥ $50k — you review before sending</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="slate">observed</Badge>
            <span>Negotiation / Closed — agent watches only, no action</span>
          </div>
        </div>
      </Card>

      {/* Pending approvals */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-white">Pending Approvals</h2>
          {totalPending > 0 && <Badge color="amber">{totalPending}</Badge>}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : inbox.pending.length === 0 ? (
          <Card className="p-8 text-center" data-testid="no-pending">
            <Check size={28} className="mx-auto text-emerald-400 mb-2" />
            <p className="text-slate-300 font-medium">No pending approvals</p>
            <p className="text-sm text-slate-500">Run the agent to scan at-risk deals.</p>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="pending-list">
            {inbox.pending.map((a) => (
              <ActionCard
                key={a.id}
                action={a}
                onApprove={approve}
                onReject={reject}
                loading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Recent Activity</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : inbox.recent.length === 0 ? (
          <Card className="p-6 text-center text-slate-500 text-sm" data-testid="no-recent">
            No agent actions yet. Run the agent to get started.
          </Card>
        ) : (
          <div className="space-y-3" data-testid="recent-list">
            {inbox.recent.map((a) => (
              <ActionCard
                key={a.id}
                action={a}
                onApprove={approve}
                onReject={reject}
                loading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}