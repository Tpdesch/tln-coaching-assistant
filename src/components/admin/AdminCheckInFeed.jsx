import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Loader2 } from "lucide-react";
import CheckInResultCard from "@/components/CheckInResultCard";

export default function AdminCheckInFeed({ allProfiles, allClients, allInteractions, allRuns }) {
  const [interactions, setInteractions] = useState(allInteractions || []);
  const [runs, setRuns] = useState(allRuns || []);
  const [coachFilter, setCoachFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  // Keep local state in sync when parent props change
  useEffect(() => {
    setInteractions(allInteractions || []);
  }, [allInteractions]);
  useEffect(() => {
    setRuns(allRuns || []);
  }, [allRuns]);

  // Real-time subscription — new check-ins appear as they come in
  useEffect(() => {
    const unsubInteractions = base44.entities.Interactions.subscribe((event) => {
      if (event.type === "create") {
        setInteractions(prev => [event.data, ...prev]);
      } else if (event.type === "update") {
        setInteractions(prev => prev.map(i => i.id === event.data.id ? event.data : i));
      } else if (event.type === "delete") {
        setInteractions(prev => prev.filter(i => i.id !== event.data.id));
      }
    });
    const unsubRuns = base44.entities.InferenceRuns.subscribe((event) => {
      if (event.type === "create") {
        setRuns(prev => [event.data, ...prev]);
      } else if (event.type === "update") {
        setRuns(prev => prev.map(r => r.id === event.data.id ? event.data : r));
      } else if (event.type === "delete") {
        setRuns(prev => prev.filter(r => r.id !== event.data.id));
      }
    });
    return () => { unsubInteractions(); unsubRuns(); };
  }, []);

  // Build lookup maps
  const profileById = useMemo(() => {
    const map = {};
    (allProfiles || []).forEach(p => { map[p.id] = p; });
    return map;
  }, [allProfiles]);

  const clientByProfileId = useMemo(() => {
    const map = {};
    (allClients || []).forEach(c => {
      if (c.base44_user_id) {
        const profile = (allProfiles || []).find(p => p.base44_user_id === c.base44_user_id);
        if (profile) map[profile.id] = c;
      }
    });
    return map;
  }, [allClients, allProfiles]);

  const runsByInteractionId = useMemo(() => {
    const map = {};
    (runs || []).forEach(r => { if (r.interaction_id) map[r.interaction_id] = r; });
    return map;
  }, [runs]);

  // Coaches list for filter
  const coaches = useMemo(() => {
    return (allProfiles || []).filter(p => p.role === "COACH" || p.role === "coach_admin");
  }, [allProfiles]);

  // Filter to weekly check-ins only
  const weeklyCheckins = useMemo(() => {
    return (interactions || [])
      .filter(i => i.type === "weekly_checkin")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [interactions]);

  // Apply filters
  const filtered = useMemo(() => {
    return weeklyCheckins.filter(i => {
      if (coachFilter !== "all") {
        const client = clientByProfileId[i.client_profile_id];
        if (!client || client.coach_id !== coachFilter) return false;
      }
      if (clientFilter !== "all") {
        if (i.client_profile_id !== clientFilter) return false;
      }
      return true;
    });
  }, [weeklyCheckins, coachFilter, clientFilter, clientByProfileId]);

  // Participants for filter dropdown (based on selected coach)
  const participantOptions = useMemo(() => {
    const profileIds = new Set(weeklyCheckins.map(i => i.client_profile_id).filter(Boolean));
    return (allProfiles || []).filter(p => profileIds.has(p.id));
  }, [allProfiles, weeklyCheckins]);

  const getCoachName = (checkin) => {
    const client = clientByProfileId[checkin.client_profile_id];
    if (client?.coach_id) {
      const coach = profileById[client.coach_id];
      return coach?.display_name || coach?.full_name || "Unknown";
    }
    return "Unassigned";
  };

  const getParticipantName = (checkin) => {
    const profile = profileById[checkin.client_profile_id];
    if (profile) return profile.display_name || profile.full_name || "Unknown";
    const client = clientByProfileId[checkin.client_profile_id];
    return client?.full_name || "Unknown";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Live Check-In Feed</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            All participant check-ins across coaches · updates in real time
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={coachFilter}
            onChange={e => { setCoachFilter(e.target.value); setClientFilter("all"); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">All Coaches</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id}>{c.display_name || c.full_name || c.id}</option>
            ))}
          </select>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">All Participants</option>
            {participantOptions.map(p => (
              <option key={p.id} value={p.id}>{p.display_name || p.full_name || p.id}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No check-ins found for the current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-gray-500">
            Showing {filtered.length} check-in{filtered.length !== 1 ? "s" : ""}
          </div>
          {filtered.map(interaction => {
            const inferenceRun = runsByInteractionId[interaction.id];
            const coachName = getCoachName(interaction);
            const participantName = getParticipantName(interaction);
            return (
              <div key={interaction.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-900">{participantName}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">Coach: {coachName}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">
                    {new Date(interaction.created_date).toLocaleString()}
                  </span>
                </div>
                <CheckInResultCard
                  interaction={interaction}
                  inferenceRun={inferenceRun}
                  defaultExpanded={false}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}