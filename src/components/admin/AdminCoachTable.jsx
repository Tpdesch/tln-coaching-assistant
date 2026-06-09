import React from "react";

export default function AdminCoachTable({ allProfiles, allClients, allInteractions }) {
  const coaches = allProfiles.filter(p => p.role === "COACH");

  const rows = coaches.map(coach => {
    // Clients assigned to this coach via Client entity
    const assignedClients = allClients.filter(c => c.coach_id === coach.id);
    const clientProfileIds = new Set(assignedClients.map(c => c.base44_user_id).filter(Boolean));

    // Also match by profile id directly
    const allClientProfileIds = new Set([
      ...assignedClients.map(c => c.base44_user_id).filter(Boolean),
    ]);

    const coachCheckins = allInteractions.filter(
      i => i.type === "weekly_checkin" && allClientProfileIds.has(i.client_profile_id)
    );

    const latestCheckin = coachCheckins.sort((a, b) =>
      new Date(b.created_date) - new Date(a.created_date)
    )[0];

    return {
      id: coach.id,
      name: coach.display_name || coach.id,
      assignedCount: assignedClients.length,
      totalCheckins: coachCheckins.length,
      latestActivity: latestCheckin?.created_date
        ? new Date(latestCheckin.created_date).toLocaleDateString()
        : "—",
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Coach Summary</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Coach</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Profile ID</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Assigned Clients</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Client Check-Ins</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Latest Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-xs">No coaches found</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3 text-right text-gray-700">{r.assignedCount}</td>
                <td className="px-4 py-3 text-right text-gray-700">{r.totalCheckins}</td>
                <td className="px-4 py-3 text-gray-500">{r.latestActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}