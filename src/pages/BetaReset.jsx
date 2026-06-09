import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, ShieldAlert, CheckCircle2, Trash2 } from "lucide-react";

export default function BetaReset() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const runPreview = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    setResult(null);
    setConfirmed(false);
    const res = await base44.functions.invoke("betaReset", { mode: "preview" });
    setPreview(res.data);
    setLoading(false);
  };

  const runExecute = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("betaReset", { mode: "execute" });
    setResult(res.data);
    setLoading(false);
    setPreview(null);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-6 h-6 text-red-600" />
        <h1 className="text-xl font-bold text-gray-900">Beta Reset — Data Cleanup</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">What will be deleted:</p>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>All <strong>Interactions</strong> records (check-ins)</li>
          <li>All <strong>InferenceRuns</strong> records (analysis results)</li>
        </ul>
        <p className="font-semibold mt-2">What will NOT be touched:</p>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>Profiles, Clients, Coach assignments, Configuration data</li>
        </ul>
      </div>

      {!preview && !result && (
        <Button onClick={runPreview} disabled={loading} className="bg-[#1E3A5F] hover:bg-[#162d4a]">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading Preview...</> : "Preview Data to be Removed"}
        </Button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {preview && !result && (
        <div className="space-y-5">
          {/* Counts */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Records to be Deleted</h2>
            <div className="flex gap-6">
              <div>
                <div className="text-3xl font-bold text-red-600">{preview.interactions_count}</div>
                <div className="text-xs text-gray-500 mt-0.5">Interactions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{preview.inference_runs_count}</div>
                <div className="text-xs text-gray-500 mt-0.5">Inference Runs</div>
              </div>
            </div>
          </div>

          {/* Test clients */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Suspected Test/Demo Client Records
              <span className="ml-2 text-xs font-normal text-gray-400">(flagged by name or email — NOT auto-deleted)</span>
            </h2>
            {preview.test_clients.length === 0 ? (
              <p className="text-sm text-gray-400">None detected.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400">
                  <tr>
                    <th className="text-left py-1">Name</th>
                    <th className="text-left py-1">Email</th>
                    <th className="text-left py-1">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.test_clients.map(c => (
                    <tr key={c.id}>
                      <td className="py-2 font-medium text-gray-800">{c.full_name}</td>
                      <td className="py-2 text-gray-500">{c.email}</td>
                      <td className="py-2 text-gray-500">{c.coaching_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Confirmation */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2 text-sm text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>This action is <strong>irreversible</strong>. All Interactions and InferenceRuns will be permanently deleted.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-red-800 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4" />
              I understand this is permanent and irreversible
            </label>
            <div className="flex gap-3 pt-1">
              <Button
                onClick={runExecute}
                disabled={!confirmed || loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" />Confirm & Run Cleanup</>}
              </Button>
              <Button variant="outline" onClick={() => { setPreview(null); setConfirmed(false); }} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-semibold text-emerald-800">Reset Complete</h2>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-3xl font-bold text-emerald-700">{result.deleted_interactions}</div>
              <div className="text-xs text-emerald-600 mt-0.5">Interactions deleted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-700">{result.deleted_inference_runs}</div>
              <div className="text-xs text-emerald-600 mt-0.5">Inference Runs deleted</div>
            </div>
          </div>
          <p className="text-sm text-emerald-700">{result.message}</p>
          <Button variant="outline" onClick={() => { setResult(null); setPreview(null); setConfirmed(false); }}>
            Run Again
          </Button>
        </div>
      )}
    </div>
  );
}