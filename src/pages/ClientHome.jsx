import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";

export default function ClientHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [latestRun, setLatestRun] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const me = await base44.auth.me();
        if (!me) { setError("Not authenticated."); return; }

        const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
        const p = Array.isArray(rows) ? rows[0] : null;
        setProfile(p);

        const clientRows = await base44.entities.Client.filter({ base44_user_id: me.id });
        const client = Array.isArray(clientRows) ? clientRows[0] : null;

        if (!client?.full_name) { navigate("/ClientOnboarding"); return; }

        if (!p?.id) { setLatestRun(null); return; }

        const runs = await base44.entities.InferenceRuns.filter({ client_profile_id: p.id });
        const sorted = (Array.isArray(runs) ? runs : [])
          .slice()
          .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)));
        setLatestRun(sorted[0] || null);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Your Alignment Companion</h1>
        <p className="text-gray-600 mt-2">
          A quick weekly check-in keeps your thought + action aligned with the needs of your role.
        </p>
      </div>

      {/* Primary CTA */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">Ready for your weekly check-in?</div>
          <div className="text-sm text-gray-600 mt-1">3–5 minutes. Private. Actionable.</div>
        </div>
        <Link
          to="/ClientCheckIn"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition"
        >
          Start
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        {/* Latest Insight Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Most Recent Analysis</div>
            {latestRun?.created_date ? (
              <div className="text-xs text-gray-500">{new Date(latestRun.created_date).toLocaleDateString()}</div>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-gray-500">Loading…</div>
          ) : error ? (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          ) : !latestRun ? (
            <div className="mt-4 text-sm text-gray-600">
              No analysis yet. Run your first check-in to generate alignment insights.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {latestRun.top_action_level_1 != null && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <div className="text-xs text-gray-500">Top Action Levels</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    Level {latestRun.top_action_level_1}
                    {latestRun.top_action_level_2 && ` • Level ${latestRun.top_action_level_2}`}
                  </div>
                </div>
              )}
              {latestRun.aci != null && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <div className="text-xs text-gray-500">Alignment Consistency Index</div>
                  <div className="mt-1 text-sm font-semibold text-blue-900">
                    {latestRun.aci.toFixed(0)}
                    {latestRun.aci_delta != null && (
                      <span className={`ml-2 text-xs font-normal ${latestRun.aci_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {latestRun.aci_delta >= 0 ? '↑' : '↓'} {Math.abs(latestRun.aci_delta).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {latestRun.coach_reflection_text && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">Coaching Insight</div>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {latestRun.coach_reflection_text}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Check-Ins history link */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Check-In History</div>
                <div className="text-xs text-gray-500 mt-0.5">Review your past weekly check-ins and insights.</div>
              </div>
              <Link
                to="/MyCheckIns"
                className="text-xs text-amber-600 hover:underline font-medium"
              >
                View all →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}