import React, { useEffect, useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard, Users, CalendarCheck, LogOut, Menu, X, Home, ClipboardList, ShieldCheck, RotateCcw, FileText } from "lucide-react";

const coachNav = [
  { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard },
  { label: "Clients", path: "/Clients", icon: Users },
  { label: "Check-Ins", path: "/CheckIns", icon: CalendarCheck },
  { label: "Leadership Brief", path: "/MonthlyLeadershipReview", icon: FileText },
];

const clientNav = [
  { label: "Home", path: "/ClientHome", icon: Home },
  { label: "My Check-Ins", path: "/MyCheckIns", icon: ClipboardList },
];

const adminNav = [
  { label: "Admin Dashboard", path: "/AdminDashboard", icon: ShieldCheck },
  { label: "Beta Reset", path: "/BetaReset", icon: RotateCcw },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me().catch(() => null);
      if (!me) return;
      const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
      const p = Array.isArray(rows) ? rows[0] : null;
      const displayName = p?.display_name || p?.full_name || me.full_name || me.email || "";
      setUserName(displayName.split(" ")[0] || "");
      // Platform admins and coach_admin profiles get admin navigation
      const effectiveRole = me.role === "admin" || p?.role === "admin" || p?.role === "coach_admin"
        ? "admin"
        : p?.role || null;
      setRole(effectiveRole);
    })();
  }, []);

  const navItems = role === "admin" ? adminNav : role === "COACH" ? coachNav : role === "CLIENT" ? clientNav : [];
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-[#1E3A5F] border-r border-gray-100 shrink-0">
        <div className="px-5 py-5 border-b border-[#0F1F35]">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f79ad4f5b634677bf810/16ea238ca_LeadershipNexusLogoResized.jpg"
            alt="TLN Coaching Assistant"
            className="h-8 w-auto object-contain"
          />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = currentPath === path || currentPath.startsWith(path + "?");
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-[#2D5A8C] text-white" : "text-gray-300 hover:bg-[#0F1F35] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-[#0F1F35]">
          {userName && <div className="px-3 py-1 text-xs text-gray-400 mb-2">{userName}</div>}
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-[#0F1F35] hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f79ad4f5b634677bf810/16ea238ca_LeadershipNexusLogoResized.jpg"
          alt="TLN"
          className="h-7 w-auto object-contain"
        />
        <button onClick={() => setMobileOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-gray-100">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-14">
          <nav className="px-4 py-4 space-y-1">
            {navItems.map(({ label, path, icon: Icon }) => {
              const active = currentPath === path;
              return (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active ? "bg-amber-50 text-amber-700" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              );
            })}
            <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full mt-4">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 md:overflow-auto">
        <div className="md:hidden h-14" /> {/* mobile header spacer */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}