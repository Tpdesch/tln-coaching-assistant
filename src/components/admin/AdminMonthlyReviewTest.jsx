import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2, Play } from "lucide-react";

export default function AdminMonthlyReviewTest({ allProfiles, allClients }) {
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Build participant options — clients with profile IDs
  const participants = useMemo(() => {
    const profileById = {};
    (allProfiles || []).forEach(p => { profileById[p.id] = p; });

    return (allClients || [])
      .filter(c => c.base44_user_id)
      .map(c => {
        const profile = (allProfiles || []).find(p => p.base44_user_id === c.base44_user_id);
        return profile ? { profileId: profile.id, name: profile.display_name || profile.full_name || c.full_name || c.email } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allProfiles, allClients]);

  const handleGenerate = async () => {
    if (!selectedProfileId || !selectedMonth) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await base44.functions.invoke("generateMonthlyLeadershipReview", {
        client_profile_id: selectedProfileId,
        month: selectedMonth,
      });
      setResult(res.data);
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-amber-600" />
        <h2 className="text-base font-semibold text-gray-900">Generate Monthly Review Test</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Temporary test panel — generates a structured monthly leadership review. Nothing is saved or sent.
      </p>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Participant</label>
          <select
            value={selectedProfileId}
            onChange={e => { setSelectedProfileId(e.target.value); setResult(null); setError(null); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">— Select participant —</option>
            {participants.map(p => (
              <option key={p.profileId} value={p.profileId}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => { setSelectedMonth(e.target.value); setResult(null); setError(null); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={!selectedProfileId || !selectedMonth || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Generate
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Raw JSON Output</h3>
            <span className="text-xs text-gray-400">
              Generated {new Date(result.generated_at).toLocaleString()}
            </span>
          </div>
          <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-800 overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre-wrap break-words">
{JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}