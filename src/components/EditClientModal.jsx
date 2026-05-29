import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Lock } from "lucide-react";

const STATUS_OPTIONS = ["active", "paused", "completed", "onboarding", "invited"];

export default function EditClientModal({ client, onClose, onSaved }) {
  const canEditEmail = client?.status === "invited";

  const [form, setForm] = useState({
    full_name: client?.full_name || "",
    role: client?.role || "",
    department: client?.department || "",
    email: client?.email || "",
    status: client?.status || "active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      // Authorization: re-fetch the client record server-side and verify coach ownership
      const me = await base44.auth.me();
      if (!me) { setError("Not authenticated."); setSubmitting(false); return; }

      const freshClient = await base44.entities.Client.get(client.id);
      if (!freshClient) { setError("Client record not found."); setSubmitting(false); return; }

      const myProfiles = await base44.entities.Profiles.filter({ base44_user_id: me.id });
      const myProfile = Array.isArray(myProfiles) ? myProfiles[0] : null;

      if (!myProfile || myProfile.role !== "COACH") {
        setError("You do not have permission to edit this client.");
        setSubmitting(false);
        return;
      }

      if (freshClient.coach_id !== myProfile.id) {
        setError("You can only edit clients assigned to you.");
        setSubmitting(false);
        return;
      }

      const payload = {
        full_name: form.full_name.trim(),
        role: form.role.trim(),
        department: form.department.trim(),
        status: form.status,
      };
      if (canEditEmail && form.email.trim()) {
        payload.email = form.email.trim();
      }
      const updated = await base44.entities.Client.update(client.id, payload);
      onSaved({ ...client, ...payload, ...updated });
      onClose();
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="Jane Smith"
              required
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Job Title / Position</Label>
            <Input
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Director of Operations"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Department</Label>
            <Input
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Finance, Sales, Engineering"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Email</Label>
            {canEditEmail ? (
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="participant@example.com"
              />
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
                  <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {form.email || "—"}
                </div>
                <p className="text-xs text-gray-400">Email is used for login and cannot be changed here.</p>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Status</Label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#102A43] hover:bg-[#243B53]" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}