import { useEffect, useState } from "react";
import { UserPlus, Shield, Trash2, Copy } from "lucide-react";
import api, { apiError } from "../lib/api";
import { Card, Button, Badge, Avatar, Modal, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const ROLE_COLOR = { owner: "violet", admin: "indigo", member: "blue", viewer: "slate" };
const ROLES = ["admin", "member", "viewer"];

function InviteModal({ onClose, onInvited }) {
  const [form, setForm] = useState({ name: "", email: "", role: "member" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/team/invite", form);
      setResult(data.data);
      onInvited?.();
      toast.success("Member invited");
    } catch (err) { toast.error(apiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Invite team member" testid="invite-modal">
      {result ? (
        <div className="fade-up">
          <p className="text-sm text-slate-300 mb-3">Invited <b className="text-white">{result.name}</b>. Share these temporary credentials:</p>
          <div className="bg-ink border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-300 mb-4">
            <div>{result.email}</div>
            <div className="text-indigo-300">{result.temp_password}</div>
          </div>
          <Button className="w-full" onClick={() => { navigator.clipboard.writeText(`${result.email} / ${result.temp_password}`); toast.success("Copied"); }} testid="copy-creds-btn">
            <Copy size={15} /> Copy credentials
          </Button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <Input label="Name" value={form.name} onChange={set("name")} testid="invite-name" required />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} testid="invite-email" required />
          <label className="block mb-4">
            <span className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Role</span>
            <select value={form.role} onChange={set("role")} data-testid="invite-role" className="w-full bg-ink border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <Button type="submit" disabled={loading} className="w-full" testid="send-invite-btn">
            {loading ? "Inviting…" : "Send invite"}
          </Button>
        </form>
      )}
    </Modal>
  );
}

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const isAdmin = ["owner", "admin"].includes(user?.role);

  const load = async () => {
    const { data } = await api.get("/team/members");
    setMembers(data.data);
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    try { await api.patch(`/team/members/${id}`, { role }); load(); toast.success("Role updated"); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const remove = async (id) => {
    try { await api.delete(`/team/members/${id}`); load(); toast.success("Member removed"); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield size={22} className="text-indigo-400" /> Team</h1>
          <p className="text-sm text-slate-400">Manage members and their roles</p>
        </div>
        {isAdmin && <Button onClick={() => setShowInvite(true)} testid="invite-member-button"><UserPlus size={15} /> Invite</Button>}
      </div>

      <Card className="overflow-hidden" data-testid="team-members-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors" data-testid={`member-row-${m.id}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} size={34} />
                    <div>
                      <div className="font-medium text-white">{m.name} {m.id === user?.id && <span className="text-xs text-slate-500">(you)</span>}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {isAdmin && m.role !== "owner" && m.id !== user?.id ? (
                    <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)} data-testid={`role-select-${m.id}`}
                      className="bg-ink border border-slate-700 rounded-lg px-2 py-1 text-xs">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <Badge color={ROLE_COLOR[m.role]}>{m.role}</Badge>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {isAdmin && m.role !== "owner" && m.id !== user?.id && (
                    <button onClick={() => remove(m.id)} className="text-slate-600 hover:text-red-400" data-testid={`remove-member-${m.id}`}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={load} />}
    </div>
  );
}
