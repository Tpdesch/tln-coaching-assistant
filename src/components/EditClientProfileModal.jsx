import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function EditClientProfileModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: client?.full_name || "",
    role: client?.role || "",
    department: client?.notes?.match(/Department: (.+)/)?.[1] || "",
    timezone: client?.notes?.match(/Timezone: (.+)/)?.[1] || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      // Authorization: verify the logged-in user owns this client record
      const me = await base44.auth.me();
      if (!me) { setError("Not authenticated."); setSubmitting(false); return; }

      const freshClient = await base44.entities.Client.get(client.id);
      if (!freshClient) { setError("Client record not found."); setSubmitting(false); return; }

      if (freshClient.base44_user_id !== me.id) {
        setError("You can only edit your own profile.");
        setSubmitting(false);
        return;
      }

      // Rebuild notes preserving fields we don't touch (Coach, etc.)
      const existingNotes = client?.notes || "";
      const coachLine = existingNotes.match(/Coach: (.+)/)?.[0] || null;
      const notesLines = [];
      if (coachLine) notesLines.push(coachLine);
      if (form.department.trim()) notesLines.push(`Department: ${form.department.trim()}`);
      if (form.timezone.trim()) notesLines.push(`Timezone: ${form.timezone.trim()}`);

      await base44.entities.Client.update(client.id, {
        full_name: form.full_name.trim(),
        role: form.role.trim(),
        notes: notesLines.join("\n") || undefined,
      });

      // Sync display_name to the linked Profile
      const profileRows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
      const profile = Array.isArray(profileRows) ? profileRows[0] : null;
      if (profile?.id) {
        await base44.entities.Profiles.update(profile.id, { display_name: form.full_name.trim() });
      }

      onSaved({ ...client, full_name: form.full_name.trim(), role: form.role.trim() });
      toast.success("Profile updated");
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
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {[
            { key: "full_name", label: "Full Name", required: true, placeholder: "Jane Smith" },
            { key: "role", label: "Job Title / Position", placeholder: "e.g. Director of Operations" },
            { key: "department", label: "Department", placeholder: "e.g. Finance, Sales, Engineering" },
          ].map(({ key, label, required, placeholder }) => (
            <div key={key}>
              <Label className="text-sm font-medium text-gray-900 mb-1.5 block">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              <Input
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                required={required}
              />
            </div>
          ))}

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Timezone</Label>
            <select
              value={form.timezone}
              onChange={e => setForm({ ...form, timezone: e.target.value })}
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select timezone…</option>
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
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
            <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}