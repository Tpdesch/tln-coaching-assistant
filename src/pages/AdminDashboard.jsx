import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldAlert } from "lucide-react";
import AdminOverviewCards from "@/components/admin/AdminOverviewCards";
import AdminCoachTable from "@/components/admin/AdminCoachTable";
import AdminCandidateTable from "@/components/admin/AdminCandidateTable";
import AdminPatternSummary from "@/components/admin/AdminPatternSummary";
import AdminDataQuality from "@/components/admin/AdminDataQuality";
import AdminReminderPanel from "@/components/admin/AdminReminderPanel";
import AdminCoachRoster from "@/components/admin/AdminCoachRoster";
import AdminReminderLog from "@/components/admin/AdminReminderLog";

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(null); // null = loading
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me) { setAuthorized(false); return; }

        // Allow platform-level admins in directly
        if (me.role === "admin") {
          setAuthorized(true);
        } else {
          const profileRows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
          const myProfile = Array.isArray(profileRows) ? profileRows[0] : null;
          const role = myProfile?.role;

          if (role !== "admin" && role !== "coach_admin") {
            setAuthorized(false);
            return;
          }
          setAuthorized(true);
        }

        // Fetch all data in parallel
        const [allProfiles, allClients, allInteractions, allRuns] = await Promise.all([
          base44.entities.Profiles.list(),
          base44.entities.Client.list(),
          base44.entities.Interactions.list(),
          base44.entities.InferenceRuns.list(),
        ]);

        setData({ allProfiles, allClients, allInteractions, allRuns });
      } catch (e) {
        console.error(e);
        setAuthorized(false);
      }
    })();
  }, []);

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <ShieldAlert className="w-8 h-8 text-red-400" />
        <p className="text-gray-600 font-medium">Access denied. Admin or Coach Admin role required.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">TLN Admin / Pilot Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Beta activity summary across coaches and clients</p>
      </div>

      <AdminOverviewCards {...data} />
      <AdminCoachTable {...data} />
      <AdminCoachRoster {...data} />
      <AdminCandidateTable {...data} />
      <AdminPatternSummary {...data} />
      <AdminDataQuality {...data} />
      <AdminReminderPanel {...data} />
      <AdminReminderLog {...data} />
    </div>
  );
}