import { useAuth } from "../context/AuthContext";
import { Card, Avatar, Badge } from "../components/ui";
import { Building2, Mail, Shield } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const org = user?.organization;
  return (
    <div className="fade-up max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <Card className="p-6 mb-5" data-testid="profile-card">
        <h3 className="font-semibold text-white mb-4">Profile</h3>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name || "U"} size={56} />
          <div>
            <div className="font-medium text-white text-lg">{user?.name}</div>
            <div className="text-sm text-slate-400 flex items-center gap-1.5"><Mail size={13} /> {user?.email}</div>
            <div className="mt-2"><Badge color="indigo"><Shield size={11} className="mr-1" /> {user?.role}</Badge></div>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="workspace-card">
        <h3 className="font-semibold text-white mb-4">Workspace</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><Building2 size={14} /> Name</span>
            <span className="text-white font-medium">{org?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Plan</span>
            <Badge color="violet">{org?.plan}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">AI credits used</span>
            <span className="text-white font-mono">{org?.ai_credits_used}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
