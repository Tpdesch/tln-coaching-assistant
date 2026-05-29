import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, Pencil } from "lucide-react";
import CheckInResultCard from "@/components/CheckInResultCard";
import EditClientProfileModal from "@/components/EditClientProfileModal";

export default function ClientHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [client, setClient] = useState(null);
  const [latestRun, setLatestRun] = useState(null);
  const [error, setError] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

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
        const clientRecord = Array.isArray(clientRows) ? clientRows[0] : null;
        setClient(clientRecord);

        if (!clientRecord?.full_name) { navigate("/ClientOnboarding"); return; }

        if (!p?.id) { setLatestRun(null); return; }

        const [interactions, runs] = await Promise.all([
          base44.entities.Interactions.filter({ client_profile_id: p.id, type: "weekly_checkin" }, "-created_date", 1),
          base44.entities.InferenceRuns.filter({ client_profile_id: p.id }, "-created_date", 1),
        ]);
        const latestInteraction = Array.isArray(interactions) ? interactions[0] : null;
        const latestRun = Array.isArray(runs) ? runs[0] : null;
        
        if (latestInteraction && latestRun) {
          setLatestRun({ ...latestRun, _interaction: latestInteraction });
        } else {
          setLatestRun(latestRun || null);
        }
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
      {showEditProfile && client && (
        <EditClientProfileModal
          client={client}
          onClose={() => setShowEditProfile(false)}
          onSaved={(updated) => setClient(updated)}
        />
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Your Alignment Companion</h1>
          {client && (
            <div className="mt-1 text-sm text-gray-500 space-x-2">
              {client.full_name && <span className="font-medium text-gray-700">{client.full_name}</span>}
              {client.role && <span>· {client.role}</span>}
              {client.notes?.match(/Department: (.+)/)?.[1] && (
                <span>· {client.notes.match(/Department: (.+)/)[1]}</span>
              )}
            </div>
          )}
          <p className="text-gray-600 mt-2">
            A quick weekly check-in keeps your thought + action aligned with the needs of your role.
          </p>
        </div>
        <button
          onClick={() => setShowEditProfile(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 transition shrink-0 mt-1"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Profile
        </button>
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

      <div className="mt-6 space-y-4">
        {/* Latest Analysis Card */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm text-gray-500">Loading…</div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm text-red-600">{error}</div>
        ) : latestRun?._interaction ? (
          <CheckInResultCard
            interaction={latestRun._interaction}
            inferenceRun={latestRun}
            defaultExpanded={true}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm text-gray-600">
            No analysis yet. Run your first check-in to generate alignment insights.
          </div>
        )}

        {/* Check-In History link */}
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