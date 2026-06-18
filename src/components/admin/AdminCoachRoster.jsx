import React, { useState } from "react";
import { ChevronDown, ChevronRight, Mail, CheckCircle2, Clock } from "lucide-react";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  onboarding: "bg-blue-100 text-blue-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-500",
  invited: "bg-purple-100 text-purple-700",
  inactive: "bg-red-100 text-red-500",
};

export default function AdminCoachRoster({ allProfiles, allClients, allInteractions }) {
  const [expandedCoach, setExpandedCoach] = useState(null);

  const coaches = allProfiles.filter(p => p.role === "COACH" || p.role === "coach_admin");

  // Get this week's Friday date string for check-in detection
  const now = new Date();
  const daysUntilFriday = (5 - now.getDay() + 7) % 7;
  const thisFriday = new Date(now);
  thisFriday.setDate(now.getDate() + daysUntilFriday);
  const weekEnding = thisFriday.toISOString().slice(0, 10);
  const weekStart = new Date(thisFriday);
  weekStart.setDate(thisFriday.getDate() - 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  function checkedInThisWeek(client, profile) {
    return allInteractions.some(i => {
      if (i.type !== "weekly_checkin") return false;
      const matchesProfile = profile?.id && i.client_profile_id === profile.id;
      const matchesClient = !profile?.id && i.client_id === client.id;
      if (!matchesProfile && !matchesClient) return false;
      if (i.week_ending_date) return i.week_ending_date === weekEnding;
      const created = i.created_date?.slice(0, 10);
      return created >= weekStartStr && created <= weekEnding;
    });
  }

  const coachRows = coaches.map(coach => {
    const clients = allClients.filter(c => c.coach_id === coach.id);
    const profileById = {};
    allProfiles.forEach(p => { profileById[p.base44_user_id] = p; });

    const participants = clients.map(c => {
      const profile = c.base44_user_id ? profileById[c.base44_user_id] : null;
      const checkins = allInteractions.filter(
        i => i.type === "weekly_checkin" &&
          (profile?.id ? i.client_profile_id === profile.id : i.client_id === c.id)
      );
      const lastCheckin = checkins.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

      return {
        id: c.id,
        name: c.full_name,
        email: c.email,
        role: c.role,
        company: c.company,
        coaching_status: c.coaching_status,
        checkinCount: checkins.length,
        lastCheckinDate: lastCheckin?.created_date
          ? new Date(lastCheckin.created_date).toLocaleDateString()
          : null,
        completedThisWeek: checkedInThisWeek(c, profile),
      };
    });

    const completedThisWeek = participants.filter(p => p.completedThisWeek).length;

    return { coach, participants, completedThisWeek };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Coach Roster</h2>
        <p className="text-xs text-gray-500 mt-0.5">Expand each coach to see their participants</p>
      </div>

      <div className="divide-y divide-gray-100">
        {coachRows.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No coaches found</div>
        )}
        {coachRows.map(({ coach, participants, completedThisWeek }) => {
          const isOpen = expandedCoach === coach.id;
          return (
            <div key={coach.id}>
              {/* Coach header row */}
              <button
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition text-left"
                onClick={() => setExpandedCoach(isOpen ? null : coach.id)}
              >
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">
                    {coach.display_name || coach.full_name || coach.id}
                  </div>
                  {coach.email && (
                    <div className="text-xs text-gray-400 mt-0.5">{coach.email}</div>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                  <span>{participants.length} participant{participants.length !== 1 ? "s" : ""}</span>
                  <span className="text-green-600 font-medium">
                    {completedThisWeek}/{participants.length} checked in this week
                  </span>
                </div>
              </button>

              {/* Participant list */}
              {isOpen && (
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 space-y-2">
                  {participants.length === 0 && (
                    <p className="text-xs text-gray-400 py-2">No participants assigned.</p>
                  )}
                  {participants.map(p => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {p.email && (
                            <a
                              href={`mailto:${p.email}`}
                              className="flex items-center gap-1 text-xs text-amber-600 hover:underline"
                            >
                              <Mail className="w-3 h-3" />
                              {p.email}
                            </a>
                          )}
                          {p.role && <span className="text-xs text-gray-400">{p.role}</span>}
                          {p.company && <span className="text-xs text-gray-400">{p.company}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        {p.coaching_status && (
                          <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.coaching_status] || "bg-gray-100 text-gray-500"}`}>
                            {p.coaching_status}
                          </span>
                        )}
                        <span className="text-gray-400">{p.checkinCount} check-in{p.checkinCount !== 1 ? "s" : ""}</span>
                        {p.lastCheckinDate && (
                          <span className="text-gray-400">Last: {p.lastCheckinDate}</span>
                        )}
                        {p.completedThisWeek
                          ? <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />This week ✓</span>
                          : <span className="flex items-center gap-1 text-amber-500"><Clock className="w-3.5 h-3.5" />Pending</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}