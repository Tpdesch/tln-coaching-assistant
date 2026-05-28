import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, CalendarCheck, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoachDashboard() {
  const [myProfileId, setMyProfileId] = useState(null);
  const [coachFirstName, setCoachFirstName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      if (!me) { window.location.href = "/SignIn"; return; }
      setCoachFirstName((me.full_name || "").split(" ")[0] || "Coach");
      const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
      const profile = Array.isArray(rows) ? rows[0] : null;
      if (!profile || profile.role !== "COACH") { window.location.href = "/SignIn"; return; }
      setMyProfileId(profile.id);
      setReady(true);
    })();
  }, []);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["my-clients", myProfileId],
    queryFn: () => base44.entities.Client.filter({ coach_id: myProfileId }),
    enabled: !!myProfileId,
  });

  const { data: allInteractions = [], isLoading: loadingInteractions } = useQuery({
    queryKey: ["coach-interactions", myProfileId, clients.length],
    enabled: ready && clients.length > 0,
    queryFn: async () => {
      const profileMap = {};
      for (const c of clients) {
        if (c.base44_user_id) {
          const pRows = await base44.entities.Profiles.filter({ base44_user_id: c.base44_user_id });
          const p = Array.isArray(pRows) ? pRows[0] : null;
          if (p?.id) profileMap[p.id] = c.full_name || c.email;
        }
      }
      const all = await base44.entities.Interactions.list("-created_date", 200);
      return all
        .filter(i => i.type === "weekly_checkin" && profileMap[i.client_profile_id])
        .map(i => ({ ...i, _clientName: profileMap[i.client_profile_id] }));
    },
  });

  const { data: inferenceRuns = [] } = useQuery({
    queryKey: ["coach-runs", myProfileId],
    enabled: ready && allInteractions.length > 0,
    queryFn: async () => {
      const profileIds = [...new Set(allInteractions.map(i => i.client_profile_id))];
      const all = await base44.entities.InferenceRuns.list("-created_date", 200);
      return all.filter(r => profileIds.includes(r.client_profile_id));
    },
  });

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  const isLoading = loadingClients || loadingInteractions;
  const now = new Date();
  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7);

  const latestRunByProfile = inferenceRuns.reduce((acc, r) => {
    if (!acc[r.client_profile_id] || r.created_date > acc[r.client_profile_id].created_date)
      acc[r.client_profile_id] = r;
    return acc;
  }, {});

  const latestCheckinByProfile = allInteractions.reduce((acc, i) => {
    if (!acc[i.client_profile_id] || i.created_date > acc[i.client_profile_id].created_date)
      acc[i.client_profile_id] = i;
    return acc;
  }, {});

  const checkedInThisWeek = new Set(
    allInteractions.filter(i => new Date(i.created_date) >= oneWeekAgo).map(i => i.client_profile_id)
  );

  const recentCheckins = Object.values(latestCheckinByProfile)
    .sort((a, b) => b.created_date.localeCompare(a.created_date))
    .slice(0, 8);

  const checkedInCount = checkedInThisWeek.size;
  const overdueCount = clients.length - checkedInThisWeek.size;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Good morning, {coachFirstName}</h1>
        <p className="text-gray-400 text-sm mt-1">Here's what needs your attention this week</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Clients", value: clients.length, icon: Users, bg: "bg-blue-50", fg: "text-blue-600" },
          { label: "Checked In This Week", value: checkedInCount, icon: CalendarCheck, bg: "bg-green-50", fg: "text-green-600" },
          { label: "Overdue", value: overdueCount, icon: Clock, bg: "bg-amber-50", fg: "text-amber-600" },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
              <Icon className={`w-4 h-4 ${fg}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Check-Ins */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Check-Ins</h2>
          <a href="/CheckIns" className="text-xs text-amber-600 hover:underline">View all</a>
        </div>
        {recentCheckins.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No check-ins yet. Invite clients to get started.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentCheckins.map(i => {
              const run = latestRunByProfile[i.client_profile_id];
              const isNew = new Date(i.created_date) >= oneWeekAgo;
              const aci = run?.aci;
              const alignmentLabel = aci == null ? null : aci >= 75 ? "Strong" : aci >= 45 ? "Moderate" : "Variable";
              const alignmentColor = aci == null ? "text-gray-800" : aci >= 75 ? "text-green-700" : aci >= 45 ? "text-amber-700" : "text-red-600";

              const gap = (i.total_thought_score || 0) - (i.total_action_score || 0);
              const gapDir = gap > 0 ? "Thought Ahead" : gap < 0 ? "Action Ahead" : "Balanced";
              const gapColor = gap > 0 ? "text-amber-700" : gap < 0 ? "text-orange-700" : "text-green-700";

              const growthLabel = run?.alignment_momentum_direction === "improving" ? "Improving" : run?.alignment_momentum_direction === "declining" ? "Declining" : "Stable";
              const growthColor = run?.alignment_momentum_direction === "improving" ? "text-green-600" : run?.alignment_momentum_direction === "declining" ? "text-red-500" : "text-slate-500";

              return (
                <div key={i.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                    {(i._clientName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{i._clientName}</div>
                    <div className="text-xs text-gray-400">{i.created_date?.slice(0, 10)}</div>
                  </div>

                  {/* Compact metric pills */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {aci != null && (
                      <div className="flex flex-col items-center px-2 py-1 rounded bg-blue-50 border border-blue-100 min-w-[54px]">
                        <span className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">Alignment</span>
                        <span className={`text-xs font-bold ${alignmentColor}`}>{alignmentLabel}</span>
                        {alignmentLabel && <span className="text-[11px] text-blue-400 text-center mt-0.5 leading-snug hidden sm:block max-w-[90px]">{aci >= 75 ? "Focus & actions aligned" : aci >= 45 ? "Building rhythm" : "Needs attention"}</span>}
                      </div>
                    )}
                    {gap != null && (
                      <div className="flex flex-col items-center px-2 py-1 rounded bg-amber-50 border border-amber-100 min-w-[54px]">
                        <span className="text-[9px] text-amber-500 font-semibold uppercase tracking-wide">Thought vs Action</span>
                        <span className={`text-[11px] font-bold ${gapColor}`}>{gapDir}</span>
                      </div>
                    )}
                    {run?.alignment_momentum_score != null && (
                      <div className="flex flex-col items-center px-2 py-1 rounded bg-indigo-50 border border-indigo-100 min-w-[54px]">
                        <span className="text-[9px] text-indigo-500 font-semibold uppercase tracking-wide">Growth</span>
                        <span className={`text-xs font-bold flex items-center gap-0.5 ${growthColor}`}>
                          {run.alignment_momentum_direction === "improving" ? <TrendingUp className="w-2.5 h-2.5" /> : run.alignment_momentum_direction === "declining" ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                    )}
                  </div>

                  {isNew && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 shrink-0">New</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Client List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">My Clients</h2>
          <a href="/Clients" className="text-xs text-amber-600 hover:underline">Manage</a>
        </div>
        {clients.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No clients yet. Add your first client to get started.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clients.slice(0, 6).map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                  {(c.full_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{c.full_name}</div>
                  {c.role && <div className="text-xs text-gray-400">{c.role}</div>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                  c.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                  c.status === "onboarding" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  "bg-gray-50 text-gray-500 border-gray-200"
                }`}>{c.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}