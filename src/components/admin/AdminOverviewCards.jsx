import React from "react";
import { Users, UserCheck, ClipboardList, Activity, TrendingUp } from "lucide-react";

function Card({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function AdminOverviewCards({ allProfiles, allClients, allInteractions }) {
  const coaches = allProfiles.filter(p => p.role === "COACH");
  const clients = allProfiles.filter(p => p.role === "CLIENT");
  const checkins = allInteractions.filter(i => i.type === "weekly_checkin");

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const checkinsThisWeek = checkins.filter(i => {
    const d = new Date(i.created_date || i.week_ending_date);
    return d >= oneWeekAgo;
  });

  const activeClientIds = new Set(checkinsThisWeek.map(i => i.client_profile_id));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card icon={Users} label="Total Coaches" value={coaches.length} color="bg-[#1E3A5F]" />
      <Card icon={UserCheck} label="Total Clients" value={clients.length} color="bg-amber-600" />
      <Card icon={ClipboardList} label="Total Check-Ins" value={checkins.length} color="bg-emerald-600" />
      <Card icon={Activity} label="Check-Ins This Week" value={checkinsThisWeek.length} color="bg-blue-500" />
      <Card icon={TrendingUp} label="Active Clients This Week" value={activeClientIds.size} color="bg-purple-600" />
    </div>
  );
}