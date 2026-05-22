import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import CheckInResultCard from "@/components/CheckInResultCard";

export default function MyCheckIns() {
  const [interactions, setInteractions] = useState([]);
  const [inferenceMap, setInferenceMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me) return;
        const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
        const profile = Array.isArray(rows) ? rows[0] : null;
        if (!profile) return;
        const [interactionRows, inferenceRows] = await Promise.all([
          base44.entities.Interactions.filter({ client_profile_id: profile.id, type: "weekly_checkin" }, "-week_ending_date"),
          base44.entities.InferenceRuns.filter({ client_profile_id: profile.id }, "-created_date"),
        ]);
        setInteractions(Array.isArray(interactionRows) ? interactionRows : []);
        const map = {};
        (Array.isArray(inferenceRows) ? inferenceRows : []).forEach(run => {
          if (run.interaction_id && !map[run.interaction_id]) map[run.interaction_id] = run;
        });
        setInferenceMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Check-Ins</h1>
        <p className="text-gray-500 text-sm mt-1">Review your past weekly alignment check-ins and insights.</p>
      </div>
      {interactions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No check-ins yet. Complete your first weekly check-in to see your history here.</div>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction, idx) => (
            <CheckInResultCard
              key={interaction.id}
              interaction={interaction}
              inferenceRun={inferenceMap[interaction.id] || null}
              defaultExpanded={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}