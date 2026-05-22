import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import CheckInCarousel from "@/components/CheckInCarousel";

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

  const { data: inferenceRuns = [] } = useQuery({
    queryKey: ["inference-runs", myProfileId],
    enabled: !!myProfileId && participantInteractions.length > 0,
    queryFn: async () => {
      const allRuns = await base44.entities.InferenceRuns.list("-created_date", 200);
      return allRuns;
    },
  });

  const participantCheckInItems = participantInteractions.filter(i => i.type === "weekly_checkin");
  const filteredInteractions = clientFilter === "all"
    ? participantCheckInItems
    : participantCheckInItems.filter(i => i._clientId === clientFilter);

  // Map inference runs by interaction ID
  const runsByInteractionId = inferenceRuns.reduce((acc, run) => {
    if (run.interaction_id) acc[run.interaction_id] = run;
    return acc;
  }, {});

  // Build carousel items
  const carouselItems = filteredInteractions.map(interaction => ({
    interaction,
    inferenceRun: runsByInteractionId[interaction.id]
  }));

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
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Weekly Check-Ins</h2>
        {loadingInteractions ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
        ) : filteredInteractions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No check-ins found yet.</p>
          </div>
        ) : (
          <CheckInCarousel items={carouselItems} />
        )}
      </div>
    </div>
  );
}