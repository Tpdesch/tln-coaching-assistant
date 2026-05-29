import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Briefcase, Building2, Pencil, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import EditClientModal from "@/components/EditClientModal";
import RemoveParticipantDialog from "@/components/RemoveParticipantDialog";

const statusConfig = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paused: { label: "Paused", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  onboarding: { label: "Onboarding", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  invited: { label: "Invited", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  inactive: { label: "Inactive", cls: "bg-gray-100 text-gray-400 border-gray-200" },
};

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [removingClient, setRemovingClient] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState(null);
  const [search, setSearch] = useState("");
  const [myProfileId, setMyProfileId] = useState(null);
  const [form, setForm] = useState({ full_name: "", role: "", company: "", email: "", coaching_status: "active" });
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      if (!me) return;
      const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
      const p = Array.isArray(rows) ? rows[0] : null;
      setMyProfileId(p?.id || null);
    })();
  }, []);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", myProfileId],
    queryFn: () => base44.entities.Client.filter({ coach_id: myProfileId }),
    enabled: !!myProfileId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create({ ...data, coach_id: myProfileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", myProfileId] });
      setShowForm(false);
      setForm({ full_name: "", role: "", company: "", email: "", coaching_status: "active" });
    },
  });

  const handleInviteParticipant = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteMessage(null);
    try {
      const existing = await base44.entities.Client.filter({ email: inviteEmail });
      const existingClient = Array.isArray(existing) ? existing[0] : null;
      if (existingClient?.status === "active") {
        setInviteMessage({ type: "info", text: `${inviteEmail} is already an active participant.` });
        setInviting(false);
        return;
      }
      const response = await base44.functions.invoke("inviteParticipant", {
        participantEmail: inviteEmail,
        participantName: inviteEmail.split("@")[0],
        coachProfileId: myProfileId,
      });
      if (response.data.ok) {
        setInviteMessage({ type: "success", text: `Invitation created for ${inviteEmail}`, link: response.data.invitation_url });
        queryClient.invalidateQueries({ queryKey: ["clients", myProfileId] });
        setInviteEmail("");
      } else {
        setInviteMessage({ type: "error", text: response.data.error_message || "Failed to send invitation" });
      }
    } catch (e) {
      const detail = e?.response?.data?.error_message || e?.response?.data?.error || e.message || "Failed to send invitation";
      setInviteMessage({ type: "error", text: `Error: ${detail}` });
    } finally {
      setInviting(false);
    }
  };

  const filtered = clients.filter((c) =>
    c.coaching_status !== "inactive" &&
    (c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your coaching relationships</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowInvite(true)} variant="outline" className="gap-2">
            <Mail className="w-4 h-4" /> Invite Participant
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-[#102A43] hover:bg-[#243B53] gap-2">
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="pl-10" />
      </div>

      {isLoading || !myProfileId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">{search ? "No clients match your search" : "No clients yet. Add your first client to get started."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((client) => {
            const status = statusConfig[client.coaching_status] || statusConfig.onboarding;
            return (
              <div key={client.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all relative group">
                <Link to={`/ClientDetail?id=${client.id}`} className="flex items-start gap-4 block">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#334E68] to-[#102A43] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">{client.full_name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{client.full_name}</span>
                      <Badge variant="outline" className={`text-xs ${status.cls}`}>{status.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      {client.role && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{client.role}</span>}
                      {client.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{client.company}</span>}
                    </div>
                  </div>
                </Link>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={e => { e.preventDefault(); setEditingClient(client); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                    title="Edit client"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {client.coaching_status !== "inactive" && (
                    <button
                      onClick={e => { e.preventDefault(); setRemovingClient(client); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Remove participant"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaved={(updated) => {
            queryClient.invalidateQueries({ queryKey: ["clients", myProfileId] });
            setEditingClient(null);
          }}
        />
      )}

      {/* Remove Participant Dialog */}
      {removingClient && (
        <RemoveParticipantDialog
          client={removingClient}
          coachProfileId={myProfileId}
          onClose={() => setRemovingClient(null)}
          onRemoved={() => queryClient.invalidateQueries({ queryKey: ["clients", myProfileId] })}
        />
      )}

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={(open) => { setShowInvite(open); if (!open) { setInviteMessage(null); setInviteEmail(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invite Participant</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Send an invitation to a new participant. They'll be linked to you as their coach once they join.</p>
          <div className="space-y-3 mt-2">
            <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="participant@example.com" />
            {inviteMessage && (
              <div className={`text-sm p-3 rounded-lg ${inviteMessage.type === "success" ? "bg-green-50 text-green-700" : inviteMessage.type === "info" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                <p>{inviteMessage.text}</p>
                {inviteMessage.link && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className="text-xs font-semibold mb-2">Invitation link (share manually if needed):</p>
                    <div className="flex gap-2">
                      <button onClick={() => navigator.clipboard.writeText(inviteMessage.link)} className="text-xs px-2 py-1 rounded bg-white bg-opacity-30 hover:bg-opacity-50 transition">Copy Link</button>
                      <a href={inviteMessage.link} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-white bg-opacity-30 hover:bg-opacity-50 transition">Open Link</a>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Button onClick={handleInviteParticipant} disabled={inviting || !inviteEmail || inviteMessage?.type === "info"} className="w-full bg-[#102A43] hover:bg-[#243B53]">
              {inviting ? "Checking…" : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {[
              { key: "full_name", label: "Full Name", placeholder: "Jane Smith" },
              { key: "role", label: "Job Title", placeholder: "Director of Operations" },
              { key: "company", label: "Organization", placeholder: "Acme Corp" },
              { key: "email", label: "Email", placeholder: "jane@example.com", type: "email" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-900 mb-1.5 block">{label}</label>
                <Input type={type || "text"} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
              </div>
            ))}
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.full_name} className="w-full bg-[#102A43] hover:bg-[#243B53]">
              {createMutation.isPending ? "Adding…" : "Add Client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}