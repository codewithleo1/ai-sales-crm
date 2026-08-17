import { useEffect, useState } from "react";
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Plus, Search, Sparkles, GripVertical } from "lucide-react";
import api, { fmtMoney, STAGES } from "../lib/api";
import { Button, Badge } from "../components/ui";
import AddDealModal from "../components/AddDealModal";
import EmailDraftModal from "../components/EmailDraftModal";
import { toast } from "sonner";

function scoreColor(s) {
  if (s >= 80) return "green";
  if (s >= 50) return "blue";
  if (s >= 30) return "amber";
  return "slate";
}

function DealCard({ deal, onDraft }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-slate-700 rounded-xl p-3 hover:border-slate-600 transition-colors group"
      data-testid={`deal-card-${deal.id}`}
    >
      <div className="flex items-start gap-1.5">
        <button {...attributes} {...listeners} className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing mt-0.5" data-testid={`deal-drag-${deal.id}`}>
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white leading-snug mb-2">{deal.title}</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-emerald-400">{fmtMoney(deal.value)}</span>
            <Badge color={scoreColor(deal.lead_score)}>Lead {deal.lead_score}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{deal.probability}% win</span>
            {deal.churn_score >= 0.7 && (
              <button onClick={() => onDraft(deal)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1" data-testid={`card-draft-${deal.id}`}>
                <Sparkles size={11} /> Follow up
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ stage, deals, onDraft }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const total = deals.reduce((s, d) => s + Number(d.value || 0), 0);
  return (
    <div ref={setNodeRef} className={`w-72 shrink-0 rounded-2xl p-3 transition-colors ${isOver ? "bg-slate-800/50" : "bg-slate-900/40"} border border-slate-800`} data-testid={`column-${stage.key}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
          <span className="text-sm font-semibold text-white">{stage.label}</span>
          <span className="text-xs text-slate-500">{deals.length}</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">{fmtMoney(total)}</span>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {deals.map((d) => <DealCard key={d.id} deal={d} onDraft={onDraft} />)}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [deals, setDeals] = useState([]);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [draftDeal, setDraftDeal] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data } = await api.get("/deals", { params: { page_size: 2000 } });
    setDeals(data.data);
  };
  useEffect(() => { load().catch(() => toast.error("Failed to load pipeline")); }, []);

  const onDragEnd = async ({ active, over }) => {
    if (!over) return;
    const deal = deals.find((d) => d.id === active.id);
    if (!deal || deal.stage === over.id) return;
    const prev = deals;
    setDeals(deals.map((d) => (d.id === active.id ? { ...d, stage: over.id } : d)));
    try {
      const { data } = await api.patch(`/deals/${active.id}`, { stage: over.id });
      setDeals((cur) => cur.map((d) => (d.id === active.id ? data.data : d)));
      toast.success(`Moved to ${STAGES.find((s) => s.key === over.id)?.label}`);
    } catch {
      setDeals(prev);
      toast.error("Failed to move deal");
    }
  };

  const filtered = deals.filter((d) => d.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-sm text-slate-400">Drag deals across stages · churn & lead scores auto-update</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2">
            <Search size={15} className="text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deals…" data-testid="pipeline-search" className="bg-transparent text-sm outline-none w-40" />
          </div>
          <Button onClick={() => setShowAdd(true)} testid="add-deal-button"><Plus size={15} /> Add deal</Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" data-testid="pipeline-kanban-board">
          {STAGES.map((s) => (
            <Column key={s.key} stage={s} deals={filtered.filter((d) => d.stage === s.key)} onDraft={setDraftDeal} />
          ))}
        </div>
      </DndContext>

      {showAdd && <AddDealModal onClose={() => setShowAdd(false)} onCreated={() => load()} />}
      {draftDeal && <EmailDraftModal deal={draftDeal} onClose={() => setDraftDeal(null)} />}
    </div>
  );
}
