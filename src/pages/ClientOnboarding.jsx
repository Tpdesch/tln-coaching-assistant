import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [existingClient, setExistingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ full_name: "", role: "", company: "", coach_name: "", department: "" });

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!user) { window.location.href = "/SignIn"; return; }
        setMe(user);
        setForm(f => ({ ...f, full_name: user.full_name || "" }));
        const rows = await base44.entities.Client.filter({ base44_user_id: user.id });
        const client = Array.isArray(rows) ? rows[0] : null;
        if (client) {
          setExistingClient(client);
          setForm({
            full_name: client.full_name || user.full_name || "",
            role: client.role || "",
            company: client.company || "",
            coach_name: client.notes?.match(/Coach: (.+)/)?.[1] || "",
            department: client.notes?.match(/Department: (.+)/)?.[1] || "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Please enter your name."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const notesLines = [];
      if (form.coach_name.trim()) notesLines.push(`Coach: ${form.coach_name.trim()}`);
      if (form.department.trim()) notesLines.push(`Department: ${form.department.trim()}`);
      const payload = {
        full_name: form.full_name.trim(),
        role: form.role.trim(),
        company: form.company.trim(),
        email: me.email,
        base44_user_id: me.id,
        notes: notesLines.join("\n") || undefined,
      };
      if (existingClient) {
        await base44.entities.Client.update(existingClient.id, payload);
      } else {
        await base44.entities.Client.create(payload);
      }
      window.location.href = "/ClientHome";
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f79ad4f5b634677bf810/16ea238ca_LeadershipNexusLogoResized.jpg"
          alt="TLN Coaching Assistant"
          className="h-14 w-auto mx-auto object-contain mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
        <p className="text-gray-500 mt-1 text-sm">Let's set up your profile before your first check-in.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        {[
          { key: "full_name", label: "Full Name", placeholder: "Jane Smith", required: true },
          { key: "role", label: "Job Title / Position", placeholder: "e.g. Director of Operations" },
          { key: "company", label: "Organization", placeholder: "e.g. Acme Corp" },
          { key: "department", label: "Department", placeholder: "e.g. Finance, Sales, Engineering" },
          { key: "coach_name", label: "Your Coach's Name", placeholder: "e.g. John Doe" },
        ].map(({ key, label, placeholder, required }) => (
          <div key={key}>
            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              value={form[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              required={required}
            />
          </div>
        ))}

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full bg-amber-600 hover:bg-amber-700">
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          {submitting ? "Saving…" : "Save & Continue"}
        </Button>
      </form>
    </div>
  );
}