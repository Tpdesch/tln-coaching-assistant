import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function SignIn() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(user => { setMe(user); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const handleSignIn = async (profileRole, redirectPath) => {
    if (!me) { base44.auth.redirectToLogin("/SignIn"); return; }
    setLoading(true);
    try {
      const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
      const profile = Array.isArray(rows) ? rows[0] : null;
      if (profile) {
        // Patch display_name if it was never set
        const updates = { role: profileRole };
        if (!profile.display_name) updates.display_name = me.full_name || "";
        await base44.entities.Profiles.update(profile.id, updates);
      } else {
        await base44.entities.Profiles.create({ base44_user_id: me.id, role: profileRole, display_name: me.full_name || "" });
      }
      if (profileRole === "CLIENT") {
        const clientRows = await base44.entities.Client.filter({ email: me.email });
        const client = Array.isArray(clientRows) ? clientRows[0] : null;
        if (client && !client.base44_user_id) {
          await base44.entities.Client.update(client.id, { base44_user_id: me.id });
        }
        const hasProfile = client?.full_name && !client.full_name.includes("@");
        window.location.href = hasProfile ? "/ClientHome" : "/ClientOnboarding";
        return;
      }
      window.location.href = redirectPath;
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f79ad4f5b634677bf810/16ea238ca_LeadershipNexusLogoResized.jpg"
            alt="TLN Coaching Assistant"
            className="h-14 w-auto mx-auto object-contain mb-6"
          />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome</h1>
          <p className="text-gray-500 text-sm mb-6">Sign in to continue to TLN Coaching Assistant.</p>
          <button
            onClick={() => base44.auth.redirectToLogin("/SignIn")}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-xl text-sm font-semibold transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f79ad4f5b634677bf810/16ea238ca_LeadershipNexusLogoResized.jpg"
          alt="TLN Coaching Assistant"
          className="h-14 w-auto mx-auto object-contain mb-4"
        />
        <p className="text-sm text-gray-400 uppercase tracking-widest font-medium">How are you signing in?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <button
          onClick={() => handleSignIn("COACH", "/Dashboard")}
          className="bg-white border-2 border-gray-200 hover:border-amber-400 rounded-2xl p-6 text-left transition-all shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <span className="text-amber-600 text-lg font-bold">C</span>
          </div>
          <div className="font-semibold text-gray-900 mb-1">Coach</div>
          <div className="text-xs text-gray-500 leading-relaxed">View your clients, track check-ins, and monitor alignment progress.</div>
        </button>
        <button
          onClick={() => handleSignIn("CLIENT", "/ClientHome")}
          className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-2xl p-6 text-left transition-all shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <span className="text-blue-600 text-lg font-bold">P</span>
          </div>
          <div className="font-semibold text-gray-900 mb-1">Participant</div>
          <div className="text-xs text-gray-500 leading-relaxed">Complete your weekly check-in and view your alignment insights.</div>
        </button>
      </div>
    </div>
  );
}