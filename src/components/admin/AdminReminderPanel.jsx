import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminReminderPanel({ allClients, allProfiles }) {
  const [mode, setMode] = useState("participant"); // "participant" | "coach"
  const [selectedValue, setSelectedValue] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Build participant options (active clients with emails)
  const activeStatuses = ["active", "onboarding"];
  const participants = (allClients || []).filter(
    c => activeStatuses.includes(c.coaching_status) && activeStatuses.includes(c.status) && c.email
  );

  // Build coach options from profiles
  const coaches = (allProfiles || []).filter(
    p => p.role === "COACH" || p.role === "coach_admin"
  );

  const handleSend = async () => {
    if (!selectedValue) return;
    setSending(true);
    setResult(null);
    setError(null);
    try {
      const payload = { dryRun: false };
      if (mode === "participant") {
        payload.targetEmail = selectedValue;
      } else {
        payload.targetCoachId = selectedValue;
      }
      const res = await base44.functions.invoke("sendWeeklyCheckInReminders", payload);
      setResult(res.data);
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Manual Reminder</h2>
      <p className="text-sm text-gray-500 mb-5">
        Send a check-in reminder to a single participant or all participants assigned to a coach.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        {["participant", "coach"].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setSelectedValue(""); setResult(null); setError(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
              mode === m
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"
            }`}
          >
            {m === "participant" ? "By Participant" : "By Coach"}
          </button>
        ))}
      </div>

      {/* Dropdown */}
      <div className="flex gap-3 items-center">
        <select
          value={selectedValue}
          onChange={e => { setSelectedValue(e.target.value); setResult(null); setError(null); }}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">— Select {mode === "participant" ? "participant" : "coach"} —</option>
          {mode === "participant"
            ? participants.map(c => (
                <option key={c.id} value={c.email}>
                  {c.full_name} ({c.email})
                </option>
              ))
            : coaches.map(p => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.full_name || p.id}
                </option>
              ))
          }
        </select>

        <button
          onClick={handleSend}
          disabled={!selectedValue || sending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 transition"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div className="text-sm text-green-800">
            {result.reminders_sent > 0
              ? <>Sent <strong>{result.reminders_sent}</strong> reminder{result.reminders_sent !== 1 ? "s" : ""} successfully.</>
              : result.skipped_completed > 0
              ? "No reminders sent — participant(s) already completed this week's check-in."
              : "No eligible participants found to remind."}
            {result.errors?.length > 0 && (
              <div className="mt-1 text-red-700">
                {result.errors.length} error(s): {result.errors.map(e => e.email).join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}