import React, { useState, useMemo } from "react";
import { Mail } from "lucide-react";

const RANGE_OPTIONS = [
  { label: "Last Week", value: "last_week" },
  { label: "This Week", value: "this_week" },
  { label: "Last 30 Days", value: "last_30" },
  { label: "All Time", value: "all" },
];

function getWeekRange(weekOffset) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export default function AdminReminderLog({ allProfiles, allClients }) {
  const [range, setRange] = useState("last_week");

  const profileById = useMemo(() => {
    const map = {};
    allProfiles.forEach(p => { map[p.id] = p; });
    return map;
  }, [allProfiles]);

  const { start, end } = useMemo(() => {
    if (range === "last_30") {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    if (range === "all") return { start: null, end: null };
    if (range === "this_week") return getWeekRange(0);
    return getWeekRange(-1);
  }, [range]);

  const sentReminders = allClients
    .filter(c => c.last_reminder_sent_at)
    .filter(c => {
      if (!start) return true;
      const sent = new Date(c.last_reminder_sent_at);
      return sent >= start && sent <= end;
    })
    .sort((a, b) => new Date(b.last_reminder_sent_at) - new Date(a.last_reminder_sent_at))
    .map(c => {
      const coach = c.coach_id ? profileById[c.coach_id] : null;
      return {
        id: c.id,
        name: c.full_name || "—",
        email: c.email || "",
        coachName: coach?.display_name || coach?.full_name || "—",
        sentAt: new Date(c.last_reminder_sent_at),
        reminderCount: c.reminder_count || 0,
      };
    });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Reminder Email Log</h2>
          <p className="text-xs text-gray-500 mt-0.5">Participants who received check-in reminder emails</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          {RANGE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Participant</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Coach</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Reminder Sent</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total Reminders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sentReminders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-xs">
                  No reminder emails sent in this period
                </td>
              </tr>
            )}
            {sentReminders.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3">
                  {r.email ? (
                    <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-amber-600 hover:underline">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="text-xs">{r.email}</span>
                    </a>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-700">{r.coachName}</td>
                <td className="px-4 py-3 text-gray-500">
                  {r.sentAt.toLocaleDateString()}{" "}
                  <span className="text-gray-400">
                    {r.sentAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{r.reminderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sentReminders.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          {sentReminders.length} reminder{sentReminders.length !== 1 ? "s" : ""} sent
        </div>
      )}
    </div>
  );
}