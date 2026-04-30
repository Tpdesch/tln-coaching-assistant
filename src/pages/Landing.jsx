import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function Landing() {
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me) { window.location.href = "/SignIn"; return; }
        const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
        const profile = Array.isArray(rows) ? rows[0] : null;
        if (profile?.role === "COACH") {
          window.location.href = "/Dashboard";
        } else if (profile?.role === "CLIENT") {
          window.location.href = "/ClientHome";
        } else {
          window.location.href = "/SignIn";
        }
      } catch (e) {
        window.location.href = "/SignIn";
      }
    })();
  }, []);
  return null;
}