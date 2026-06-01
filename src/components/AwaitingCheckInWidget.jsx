import React from "react";
import { Bell, BellOff } from "lucide-react";

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function AwaitingCheckInWidget({ clients, checkedInThisWeekIds }) {
  // Only active/onboarding clients who haven't checked in this week
  const awaiting = clients.filter(c =>
    ["active", "onboarding"].includes(c.coaching_status) &&
    ["active", "onboarding"].includes(c.status) &&
    !checkedInThisWeekIds.has(c.id)
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Participants Awaiting Check-In</h2>
        <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
          {awaiting.length}
        </span>
      </div>

      {awaiting.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          All participants have checked in this week 🎉
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {awaiting.map(c => {
            const days = daysSince(c.last_reminder_sent_at);
            const reminderSent = !!c.last_reminder_sent_at;

            return (
              <div key={c.id} className="px-5 py-3.5 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">
                  {(c.full_name || "?").charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{c.full_name}</div>
                  {c.role && <div className="text-xs text-gray-400 truncate">{c.role}</div>}
                </div>

                {/* Days since last check-in */}
                <div className="text-right shrink-0">
                  {c.coaching_start_date ? (
                    <div className="text-xs text-gray-500">
                      {daysSince(c.coaching_start_date) != null
                        ? `${daysSince(c.coaching_start_date)}d since start`
                        : "—"}
                    </div>
                  ) : null}
                </div>

                {/* Reminder status */}
                <div className="shrink-0 flex flex-col items-center gap-0.5" title={reminderSent ? `Reminder sent ${days === 0 ? "today" : `${days}d ago`} (${c.reminder_count || 1}x total)` : "No reminder sent yet"}>
                  {reminderSent ? (
                    <>
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] text-amber-500 leading-none">
                        {days === 0 ? "today" : `${days}d ago`}
                      </span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-[10px] text-gray-300 leading-none">none</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}