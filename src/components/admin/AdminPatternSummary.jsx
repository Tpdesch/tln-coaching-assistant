import React from "react";

const DIRECTION_LABELS = {
  improving: "Improving",
  declining: "Declining",
  stable: "Stable",
  emerging: "Emerging",
};

export default function AdminPatternSummary({ allRuns }) {
  // Count momentum directions as proxy for pattern summary (no derailer field exists)
  const directionCounts = {};
  const levelCounts = {};

  allRuns.forEach(run => {
    const dir = run.alignment_momentum_direction || "unknown";
    directionCounts[dir] = (directionCounts[dir] || 0) + 1;

    const lvl = run.primary_level != null ? `Level ${run.primary_level}` : "unknown";
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });

  const dirEntries = Object.entries(directionCounts).sort((a, b) => b[1] - a[1]);
  const lvlEntries = Object.entries(levelCounts).sort((a, b) => {
    const na = parseInt(a[0].replace("Level ", "")) || 99;
    const nb = parseInt(b[0].replace("Level ", "")) || 99;
    return na - nb;
  });

  const total = allRuns.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Momentum direction distribution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Momentum Direction Distribution</h2>
        <div className="space-y-2">
          {dirEntries.length === 0 && <p className="text-xs text-gray-400">No data</p>}
          {dirEntries.map(([dir, count]) => (
            <div key={dir} className="flex items-center gap-3">
              <div className="w-28 text-xs text-gray-600 capitalize">{DIRECTION_LABELS[dir] || dir}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-[#1E3A5F]"
                  style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
                />
              </div>
              <div className="w-8 text-right text-xs font-medium text-gray-700">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary level distribution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Primary Level Distribution</h2>
        <div className="space-y-2">
          {lvlEntries.length === 0 && <p className="text-xs text-gray-400">No data</p>}
          {lvlEntries.map(([lvl, count]) => (
            <div key={lvl} className="flex items-center gap-3">
              <div className="w-28 text-xs text-gray-600">{lvl}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
                />
              </div>
              <div className="w-8 text-right text-xs font-medium text-gray-700">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}