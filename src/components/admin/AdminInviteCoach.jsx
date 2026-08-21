import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminInviteCoach() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    setResult(null);
    setError(null);
    try {
      const invited = await base44.users.inviteUser(email.trim(), "user");
      // Pre-create a Profiles record so the coach appears in the roster immediately
      if (invited?.id) {
        try {
          const existing = await base44.entities.Profiles.filter({ base44_user_id: invited.id });
          if (!Array.isArray(existing) || existing.length === 0) {
            await base44.entities.Profiles.create({
              base44_user_id: invited.id,
              role: "COACH",
              full_name: fullName.trim() || "",
              email: email.trim(),
              display_name: fullName.trim() || "",
            });
          }
        } catch (_) {
          // Non-fatal — profile will be created on first sign-in
        }
      }
      setResult(`Invitation sent to ${email.trim()}.`);
      setEmail("");
      setFullName("");
    } catch (e) {
      setError(e?.response?.data?.error_message || e?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Invite New Coach</h2>
      <p className="text-sm text-gray-500 mb-5">
        Send a platform invitation to a new coach. They'll appear in the roster after accepting.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Coach full name (optional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
        <input
          type="email"
          placeholder="coach@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !inviting) handleInvite(); }}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
        <button
          onClick={handleInvite}
          disabled={inviting || !email.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
        >
          {inviting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {inviting ? "Sending..." : "Invite Coach"}
        </button>
      </div>

      {result && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{result}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}