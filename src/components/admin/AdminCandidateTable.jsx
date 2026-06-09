import React from "react";

const DIRECTION_LABELS = {
  improving: { label: "Improving", color: "text-green-700 bg-green-50" },
  declining: { label: "Declining", color: "text-red-700 bg-red-50" },
  stable: { label: "Stable", color: "text-slate-600 bg-slate-100" },
  emerging: { label: "Emerging", color: "text-amber-700 bg-amber-50" },
};

export default function AdminCandidateTable({ allProfiles, allInteractions, allRuns }) {
  const clientProfiles = allProfiles.filter(p => p.role === "CLIENT");

  const rows = clientProfiles.map(profile => {
    const profileCheckins = allInteractions
      .filter(i => i.client_profile_id === profile.id && i.type === "weekly_checkin")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const latestCheckin = profileCheckins[0];

    const profileRuns = allRuns
      .filter(r => r.client_profile_id === profile.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const latestRun = profileRuns[0];

    return {
      id: profile.id,
      name: profile.display_name || profile.id,
      primaryLevel: latestRun?.primary_level ?? "—",
      latestCheckinDate: latestCheckin?.created_date
        ? new Date(latestCheckin.created_date).toLocaleDateString()
        : "—",
      amsDirection: latestCheckin?.alignment_momentum_direction || latestRun?.alignment_momentum_direction || null,
      aci: latestRun?.aci != null ? latestRun.aci.toFixed(0) : "—",
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Candidate / Client Summary</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Client</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Profile ID</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Primary Level</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">ACI Score</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Momentum</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Latest Check-In</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-xs">No clients found</td></tr>
            )}
            {rows.map(r => {
              const dir = DIRECTION_LABELS[r.amsDirection];
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.primaryLevel}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.aci}</td>
                  <td className="px-4 py-3">
                    {dir
                      ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dir.color}`}>{dir.label}</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.latestCheckinDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}