import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Sparkles } from "lucide-react";

export default function CheckIns() {
  const urlParams = new URLSearchParams(window.location.search);
  const filterClientId = urlParams.get("client_id") || "all";
  const [clientFilter, setClientFilter] = useState(filterClientId);
  const [myProfileId, setMyProfileId] = useState(null);
  const [profileIdToName, setProfileIdToName] = useState({});

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      if (!me) return;
      const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
      const p = Array.isArray(rows) ? rows[0] : null;
      setMyProfileId(p?.id || null);
    })();
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", myProfileId],
    queryFn: () => base44.entities.Client.filter({ coach_id: myProfileId }),
    enabled: !!myProfileId,
  });

  const { data: participantInteractions = [], isLoading: loadingInteractions } = useQuery({
    queryKey: ["participant-interactions", myProfileId],
    enabled: !!myProfileId && clients.length > 0,
    queryFn: async () => {
      const profileToClientId = {};
      const nameMap = {};
      for (const c of clients) {
        if (c.base44_user_id) {
          const pRows = await base44.entities.Profiles.filter({ base44_user_id: c.base44_user_id });
          const pRow = Array.isArray(pRows) ? pRows[0] : null;
          if (pRow?.id) {
            profileToClientId[pRow.id] = c.id;
            nameMap[pRow.id] = pRow.display_name || c.full_name || c.email || null;
          }
        }
      }
      setProfileIdToName(nameMap);
      const profileIds = Object.keys(profileToClientId);
      const allInteractions = await base44.entities.Interactions.list("-created_date", 200);
      return allInteractions
        .filter(i => profileIds.includes(i.client_profile_id))
        .map(i => ({ ...i, _clientId: profileToClientId[i.client_profile_id] }));
    },
  });

  const participantCheckInItems = participantInteractions.filter(i => i.type === "weekly_checkin");
  const filteredInteractions = clientFilter === "all"
    ? participantCheckInItems
    : participantCheckInItems.filter(i => i._clientId === clientFilter);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Weekly Check-Ins</h1>
          <p className="text-gray-500 text-sm mt-1">Track client progress and identify patterns</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Participant Check-Ins</h2>
        {loadingInteractions ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : filteredInteractions.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No participant check-ins found yet.</p>
          </div>
        ) : (
          filteredInteractions.map(interaction => (
            <div key={interaction.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-sm font-bold text-indigo-700">
                  {(profileIdToName[interaction.client_profile_id] || interaction.created_by || "P").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{profileIdToName[interaction.client_profile_id] || interaction.created_by || "Participant"}</div>
                  <div className="text-xs text-gray-400">{interaction.week_ending_date || interaction.created_date?.slice(0,10) || ""}</div>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Submitted</span>
              </div>
              {interaction.reflection_text && (
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{interaction.reflection_text}</p>
              )}
              <div className="mt-2 text-xs text-slate-700">
                <span className="font-semibold">Leadership Gap: </span>
                {interaction.leadership_gap != null ? (
                  <span className={interaction.leadership_gap > 0 ? "text-amber-700 font-medium" : interaction.leadership_gap < 0 ? "text-orange-700 font-medium" : "text-green-700 font-medium"}>
                    {interaction.leadership_gap > 0 ? `+${interaction.leadership_gap}` : interaction.leadership_gap}
                    {" "}
                    {interaction.leadership_gap_direction === "thought_ahead" ? "Thought ahead" :
                      interaction.leadership_gap_direction === "action_ahead" ? "Action ahead" : "Aligned"}
                  </span>
                ) : (
                  <span className="text-slate-500 italic">Will appear after the next check-in.</span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-700">
                <span className="font-semibold">AMS: </span>
                {interaction.alignment_momentum_score != null ? (
                  <span className={interaction.alignment_momentum_direction === "improving" ? "text-green-700 font-medium" : interaction.alignment_momentum_direction === "declining" ? "text-red-600 font-medium" : "text-slate-600 font-medium"}>
                    {interaction.alignment_momentum_score > 0 ? `+${interaction.alignment_momentum_score.toFixed(0)}` : interaction.alignment_momentum_score.toFixed(0)}{" "}
                    {interaction.alignment_momentum_direction ? interaction.alignment_momentum_direction.charAt(0).toUpperCase() + interaction.alignment_momentum_direction.slice(1) : ""}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">—</span>
                )}
                <span className="text-slate-500 text-xs italic ml-1" title="Combines changes in consistency and the Thought/Action gap">(?)</span>
              </div>
              {interaction.coach_reflection_text && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">Coaching Reflection</span>
                  </div>
                  <p className="text-xs text-amber-900 whitespace-pre-line">{interaction.coach_reflection_text}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}