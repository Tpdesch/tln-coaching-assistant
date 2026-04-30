import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

const LEVEL_CONFIG = [
  { level: 1, label: "Transactional", color: "#C00000" },
  { level: 2, label: "Managerial", color: "#FFC000" },
  { level: 3, label: "Tactical", color: "#FFFF00" },
  { level: 4, label: "Strategic", color: "#00B050" },
  { level: 5, label: "Transformational", color: "#00B0F0" },
];

const LIKERT = ["Rarely", "Occasionally", "Sometimes", "Often", "Frequently"];

function CheckInCard({ interaction, inferenceRun }) {
  const [expanded, setExpanded] = useState(false);
  const aci = inferenceRun?.aci;
  const aci_delta = inferenceRun?.aci_delta;
  const coach_reflection_text = inferenceRun?.coach_reflection_text;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
      >
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Week ending {interaction.week_ending_date || interaction.created_date?.slice(0, 10)}
          </div>
          {aci != null && (
            <div className="text-xs text-gray-500 mt-0.5">ACI: {aci.toFixed(0)}{aci_delta != null && ` (${aci_delta >= 0 ? "↑" : "↓"}${Math.abs(aci_delta).toFixed(0)})`}</div>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          {aci != null && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mt-4">
              <div className="text-xs font-medium text-blue-900 mb-1">Alignment Trend</div>
              <div className="text-2xl font-bold text-blue-900">{aci.toFixed(0)}</div>
              {aci_delta != null && (
                <div className={`text-sm mt-0.5 ${aci_delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {aci_delta >= 0 ? "↑" : "↓"} {Math.abs(aci_delta).toFixed(0)} from previous week
                </div>
              )}
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Action Time</div>
            <div className="space-y-2">
              {LEVEL_CONFIG.map(({ level, label, color }) => {
                const rawLikert = interaction[`action_l${level}`] ?? 1;
                const likertIdx = Math.min(4, Math.max(0, rawLikert - 1));
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>L{level} – {label}</span>
                      <span className="text-gray-400">{LIKERT[likertIdx]}</span>
                    </div>
                    <div className="flex gap-1">
                      {[0,1,2,3,4].map((i) => (
                        <div key={i} className="flex-1 h-3 rounded-sm" style={{ backgroundColor: color, opacity: i <= likertIdx ? 1 : 0.15, outline: "1px solid rgba(0,0,0,0.3)" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Thought Time</div>
            <div className="space-y-2">
              {LEVEL_CONFIG.map(({ level, label, color }) => {
                const rawLikert = interaction[`thought_l${level}`] ?? 1;
                const likertIdx = Math.min(4, Math.max(0, rawLikert - 1));
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>L{level} – {label}</span>
                      <span className="text-gray-400">{LIKERT[likertIdx]}</span>
                    </div>
                    <div className="flex gap-1">
                      {[0,1,2,3,4].map((i) => (
                        <div key={i} className="flex-1 h-3 rounded-sm" style={{ backgroundColor: color, opacity: i <= likertIdx ? 1 : 0.15, outline: "1px solid rgba(0,0,0,0.3)" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {interaction.reflection_text && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Anchor Reflection</div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{interaction.reflection_text}</p>
            </div>
          )}

          {interaction.commitment_text && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Commitment</div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{interaction.commitment_text}</p>
            </div>
          )}

          {coach_reflection_text && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Coaching Insight</div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                {coach_reflection_text.split("\n").map((line, i) => {
                  const boldLabels = ["Observation:", "Performance implication:", "This week's challenge:"];
                  const matchedLabel = boldLabels.find(l => line.startsWith(l));
                  if (matchedLabel) return <p key={i} className="text-sm text-slate-800"><span className="font-bold">{matchedLabel}</span>{line.slice(matchedLabel.length)}</p>;
                  return <p key={i} className="text-sm text-slate-800">{line}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
          {interactions.map((interaction) => (
            <CheckInCard key={interaction.id} interaction={interaction} inferenceRun={inferenceMap[interaction.id] || null} />
          ))}
        </div>
      )}
    </div>
  );
}