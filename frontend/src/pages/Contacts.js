import { useEffect, useState } from "react";
import { Plus, Search, Mail, Building2, Trash2 } from "lucide-react";
import api from "../lib/api";
import { Card, Button, Avatar } from "../components/ui";
import AddContactModal from "../components/AddContactModal";
import { toast } from "sonner";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/contacts");
      setContacts(data.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    const prev = contacts;
    setContacts(contacts.filter((c) => c.id !== id));
    try { await api.delete(`/contacts/${id}`); toast.success("Contact removed"); }
    catch { setContacts(prev); toast.error("Failed to remove"); }
  };

  const filtered = contacts.filter((c) =>
    `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-sm text-slate-400">{contacts.length} people in your workspace</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2">
            <Search size={15} className="text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" data-testid="contacts-search" className="bg-transparent text-sm outline-none w-40" />
          </div>
          <Button onClick={() => setShowAdd(true)} testid="add-contact-button"><Plus size={15} /> Add contact</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="contacts-grid">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4 hover:border-slate-700 group" data-testid={`contact-card-${c.id}`}>
              <div className="flex items-start gap-3">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 truncate">{c.title}</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate"><Building2 size={12} /> {c.company}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate"><Mail size={12} /> {c.email}</div>
                  </div>
                </div>
                <button onClick={() => remove(c.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`delete-contact-${c.id}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} onCreated={() => load()} />}
    </div>
  );
}
