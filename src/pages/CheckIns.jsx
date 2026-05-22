import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
          filteredInteractions.map(interaction => {
            const gap = interaction.leadership_gap;
            const gapDir = gap > 0 ? "T>A" : gap < 0 ? "A>T" : "Aligned";
            const gapColor = gap > 0 ? "text-amber-700" : gap < 0 ? "text-orange-700" : "text-green-700";
            const amsColor = interaction.alignment_momentum_direction === "improving" ? "text-green-600" : interaction.alignment_momentum_direction === "declining" ? "text-red-500" : "text-slate-500";

            return (
              <div key={interaction.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-sm font-bold text-indigo-700">
                      {(profileIdToName[interaction.client_profile_id] || interaction.created_by || "P").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{profileIdToName[interaction.client_profile_id] || interaction.created_by || "Participant"}</div>
                      <div className="text-xs text-gray-400">{interaction.week_ending_date || interaction.created_date?.slice(0,10) || ""}</div>
                    </div>
                  </div>
                  {/* Compact metric pills */}
                  <div className="flex items-center gap-1 shrink-0">
                    {gap != null && (
                      <div className="flex flex-col items-center px-2 py-1 rounded bg-amber-50 border border-amber-100 min-w-[50px]">
                        <span className="text-[9px] text-amber-500 font-semibold uppercase tracking-wide">Gap</span>
                        <span className={`text-xs font-bold ${gapColor}`}>{gap > 0 ? `+${gap}` : gap}</span>
                        <span className="text-[8px] text-gray-400">{gapDir}</span>
                      </div>
                    )}
                    {interaction.alignment_momentum_score != null && (
                      <div className="flex flex-col items-center px-2 py-1 rounded bg-indigo-50 border border-indigo-100 min-w-[50px]">
                        <span className="text-[9px] text-indigo-500 font-semibold uppercase tracking-wide">AMS</span>
                        <span className={`text-xs font-bold flex items-center gap-0.5 ${amsColor}`}>
                          {interaction.alignment_momentum_direction === "improving" ? <TrendingUp className="w-2.5 h-2.5" /> : interaction.alignment_momentum_direction === "declining" ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                          {interaction.alignment_momentum_score > 0 ? `+${interaction.alignment_momentum_score.toFixed(0)}` : interaction.alignment_momentum_score.toFixed(0)}
                        </span>
                        <span className="text-[8px] text-gray-400 capitalize">{interaction.alignment_momentum_direction}</span>
                      </div>
                    )}
                  </div>
                </div>
                {interaction.reflection_text && (
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{interaction.reflection_text}</p>
                )}
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
            );
          })
        )}
      </div>
    </div>
  );
}