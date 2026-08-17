import { useState, useEffect } from "react";
import { Modal, Button } from "./ui";
import api, { apiError, STAGES } from "../lib/api";
import { toast } from "sonner";

export default function AddDealModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "", contact_id: "", stage: "lead", value: 25000, probability: 20, notes: "",
  });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/contacts", { params: { page_size: 1000 } }).then((r) => setContacts(r.data.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, value: Number(form.value), probability: Number(form.probability) };
      const { data } = await api.post("/deals", payload);
      toast.success("Deal created");
      onCreated?.(data.data);
      onClose();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const selectCls = "w-full bg-ink border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-accent";

  return (
    <Modal open onClose={onClose} title="Add deal" testid="add-deal-modal">
      <form onSubmit={submit}>
        <label className="block mb-4">
          <span className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Title</span>
          <input required value={form.title} onChange={set("title")} data-testid="deal-title-input"
            placeholder="Acme Corp — Enterprise License" className={selectCls} />
        </label>
        <label className="block mb-4">
          <span className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Contact</span>
          <select value={form.contact_id} onChange={set("contact_id")} data-testid="deal-contact-select" className={selectCls}>
            <option value="">— Select contact —</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.company}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block mb-4">
            <span className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Stage</span>
            <select value={form.stage} onChange={set("stage")} data-testid="deal-stage-select" className={selectCls}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <label className="block mb-4">
            <span className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Value ($)</span>
            <input type="number" value={form.value} onChange={set("value")} data-testid="deal-value-input" className={selectCls} />
          </label>
        </div>
        <label className="block mb-4">
          <span className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Win probability: {form.probability}%</span>
          <input type="range" min="0" max="100" value={form.probability} onChange={set("probability")} data-testid="deal-prob-input" className="w-full accent-indigo-500" />
        </label>
        <Button type="submit" disabled={loading} className="w-full" testid="save-deal-btn">
          {loading ? "Saving…" : "Create deal"}
        </Button>
      </form>
    </Modal>
  );
}
