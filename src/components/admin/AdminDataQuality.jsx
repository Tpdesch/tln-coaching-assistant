import React from "react";
import { AlertTriangle } from "lucide-react";

export default function AdminDataQuality({ allProfiles, allInteractions, allRuns }) {
  // 1. Interactions with no inference run
  const interactionIdsWithRun = new Set(allRuns.map(r => r.interaction_id).filter(Boolean));
  const checkinsWithNoRun = allInteractions.filter(
    i => i.type === "weekly_checkin" && !interactionIdsWithRun.has(i.id)
  );

  // 2. Client profiles missing primary_level on all their runs
  const clientProfiles = allProfiles.filter(p => p.role === "CLIENT");
  const profilesMissingLevel = clientProfiles.filter(profile => {
    const runs = allRuns.filter(r => r.client_profile_id === profile.id);
    return runs.length === 0 || runs.every(r => r.primary_level == null);
  });

  // 3. Runs with no alignment direction (proxy for degraded output)
  const runsNoDirScore = allRuns.filter(
    r => !r.alignment_momentum_direction && r.aci == null
  );

  const flags = [
    {
      label: "Check-ins with no inference run",
      count: checkinsWithNoRun.length,
      items: checkinsWithNoRun.slice(0, 5).map(i => i.id),
    },
    {
      label: "Client profiles with no primary level assessed",
      count: profilesMissingLevel.length,
      items: profilesMissingLevel.slice(0, 5).map(p => p.display_name || p.id),
    },
    {
      label: "Inference runs with no direction or ACI score",
      count: runsNoDirScore.length,
      items: runsNoDirScore.slice(0, 5).map(r => r.id),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-800">Data Quality Flags</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {flags.map(flag => (
          <div key={flag.label} className="px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-700">{flag.label}</div>
              {flag.items.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {flag.items.map((item, i) => (
                    <span key={i} className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{item}</span>
                  ))}
                  {flag.count > 5 && (
                    <span className="text-[10px] text-gray-400 self-center">+{flag.count - 5} more</span>
                  )}
                </div>
              )}
            </div>
            <span className={`text-lg font-bold shrink-0 ${flag.count > 0 ? "text-amber-600" : "text-green-600"}`}>
              {flag.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}