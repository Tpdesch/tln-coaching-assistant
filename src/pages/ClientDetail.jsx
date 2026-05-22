import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2, Mail, Calendar, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paused: { label: "Paused", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  onboarding: { label: "Onboarding", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  invited: { label: "Invited", cls: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get("id");
  const [clientProfile, setClientProfile] = useState(null);

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => base44.entities.Client.get(clientId),
    enabled: !!clientId,
  });

  // Resolve the client's Profiles record so we can fetch Interactions
  useEffect(() => {
    if (!client?.base44_user_id) return;
    (async () => {
      const rows = await base44.entities.Profiles.filter({ base44_user_id: client.base44_user_id });
      setClientProfile(Array.isArray(rows) ? rows[0] : null);
    })();
  }, [client?.base44_user_id]);

  const { data: interactions = [], isLoading: loadingInteractions } = useQuery({
    queryKey: ["client-interactions", clientProfile?.id],
    queryFn: () => base44.entities.Interactions.filter({ client_profile_id: clientProfile.id }, "-created_date", 20),
    enabled: !!clientProfile?.id,
  });

  const { data: inferenceRuns = [], isLoading: loadingRuns } = useQuery({
    queryKey: ["client-runs", clientProfile?.id],
    queryFn: () => base44.entities.InferenceRuns.filter({ client_profile_id: clientProfile.id }, "-created_date", 20),
    enabled: !!clientProfile?.id,
  });

  const runsByInteractionId = inferenceRuns.reduce((acc, r) => {
    acc[r.interaction_id] = r;
    return acc;
  }, {});

  const checkins = interactions.filter(i => i.type === "weekly_checkin");

  if (loadingClient) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/Clients" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700">Client not found.</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[client.coaching_status] || statusConfig.onboarding;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link to="/Clients" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>

      {/* Client Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#334E68] to-[#102A43] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl">{client.full_name?.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{client.full_name}</h1>
              <Badge variant="outline" className={`text-xs ${status.cls}`}>{status.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              {client.role && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />{client.role}</span>}
              {client.company && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{client.company}</span>}
              {client.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
            </div>
            {client.coaching_start_date && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" /> Coaching since {client.coaching_start_date}
              </div>
            )}
          </div>
        </div>

        {client.anchor_text && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Current Focus (Anchor)</p>
            <p className="text-sm text-purple-900 bg-purple-50 rounded-lg px-3 py-2">{client.anchor_text}</p>
          </div>
        )}

        {client.notes && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Check-In History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Check-In History</h2>
        {loadingInteractions || loadingRuns ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : checkins.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No check-ins submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checkins.map(interaction => {
              const run = runsByInteractionId[interaction.id];
              return (
                <div key={interaction.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      Week ending {interaction.week_ending_date || interaction.created_date?.slice(0, 10)}
                    </span>
                    <div className="flex items-center gap-3">
                      {run?.aci != null && (
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-800">ACI {run.aci.toFixed(0)}</span>
                          {run.aci_delta != null && (
                            <span className={`ml-1.5 text-xs inline-flex items-center gap-0.5 ${run.aci_delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                              {run.aci_delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(run.aci_delta).toFixed(0)}
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Submitted</span>
                    </div>
                  </div>

                  {interaction.reflection_text && (
                    <p className="text-sm text-gray-700 leading-relaxed">{interaction.reflection_text}</p>
                  )}

                  {interaction.coach_reflection_text && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-800">Coaching Reflection</span>
                      </div>
                      <p className="text-xs text-amber-900 whitespace-pre-line">{interaction.coach_reflection_text}</p>
                    </div>
                  )}

                  <div className="text-xs text-slate-700">
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
                  <div className="text-xs text-slate-700">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}