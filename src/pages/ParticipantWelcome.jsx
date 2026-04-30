import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, LogIn, AlertTriangle } from "lucide-react";

export default function ParticipantWelcome() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");
  const [pageState, setPageState] = useState("loading");
  const [formData, setFormData] = useState({ fullName: "", role: "", department: "" });
  const [error, setError] = useState(null);

  const accentColor = "#D97706";

  useEffect(() => {
    if (pageState === "activation_success") return;
    (async () => {
      if (!token) { setPageState("invalid_invitation"); return; }
      const me = await base44.auth.me().catch(() => null);
      if (!me) { setPageState("needs_auth"); return; }

      const invitations = await base44.entities.ParticipantInvitation.filter({ invitation_token: token });
      const inv = Array.isArray(invitations) ? invitations[0] : null;

      if (!inv || inv.status !== "pending" || new Date() > new Date(inv.expires_at)) {
        setPageState("invalid_invitation");
        return;
      }

      try {
        const client = await base44.entities.Client.get(inv.client_id);
        if (client?.full_name) {
          setFormData((prev) => ({ ...prev, fullName: client.full_name, role: client.role || "" }));
        }
      } catch (_) {}

      setPageState("valid_invitation");
    })();
  }, [token]);

  const handleSignIn = () => {
    base44.auth.redirectToLogin("/participant-welcome?token=" + token);
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.role) { setError("Full Name and Role are required."); return; }
    setPageState("submitting");
    setError(null);
    const response = await base44.functions.invoke("activateParticipant", {
      invitationToken: token,
      fullName: formData.fullName,
      role: formData.role,
      department: formData.department,
    });
    if (response.data?.success) {
      setPageState("activation_success");
    } else {
      setError(response.data?.error || "Activation failed. Please try again.");
      setPageState("valid_invitation");
    }
  };

  if (pageState === "loading") {
    return <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  if (pageState === "invalid_invitation") {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6">
          <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Invalid or Expired Invitation</h1>
          <p className="text-gray-600">This invitation link is no longer valid. It may have already been used, expired, or the link may be incorrect.</p>
          <Button variant="outline" onClick={() => (window.location.href = "/SignIn")}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  if (pageState === "needs_auth") {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f79ad4f5b634677bf810/16ea238ca_LeadershipNexusLogoResized.jpg" alt="TLN Coaching Assistant" className="h-14 w-auto mx-auto object-contain mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">You've been invited</h1>
            <p className="text-gray-600">You'll need to create a free account to access your coaching space. It only takes a moment.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">How to get in:</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              {[
                "Click the button below — you'll be taken to a simple sign-up page.",
                "Enter your email address and choose any password you like.",
                "You'll be brought straight back here to complete your setup.",
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ backgroundColor: accentColor }}>{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-gray-400 pt-1">Already have an account? Just sign in instead — same button.</p>
          </div>
          <Button onClick={handleSignIn} className="w-full h-11 text-base font-semibold" style={{ backgroundColor: accentColor }}>
            <LogIn className="w-4 h-4 mr-2" /> Create My Account
          </Button>
        </div>
      </div>
    );
  }

  if (pageState === "activation_success") {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-8">
          <CheckCircle2 className="w-20 h-20 mx-auto" style={{ color: accentColor }} />
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">You're all set</h1>
            <p className="text-lg text-gray-700">Your account is now active and your first check-in is ready.</p>
            <p className="text-sm text-gray-500">This space will help you reflect on where your time and attention are going each week.</p>
          </div>
          <Button onClick={() => navigate("/ClientHome")} className="w-full h-12 text-base font-semibold" style={{ backgroundColor: accentColor }}>
            Go to My Home
          </Button>
        </div>
      </div>
    );
  }

  const isSubmitting = pageState === "submitting";

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <div className="bg-white border-b border-gray-200/60">
        <div className="max-w-2xl mx-auto px-6 py-8 flex items-center justify-center">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f79ad4f5b634677bf810/16ea238ca_LeadershipNexusLogoResized.jpg" alt="TLN Coaching Assistant" className="h-14 w-auto object-contain" />
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Welcome to TLN Coaching Assistant</h1>
            <p className="text-lg text-gray-600">You've been invited by your coach to begin your leadership alignment journey.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/60 p-8 space-y-4">
            <p className="text-gray-700 leading-relaxed">This space helps you reflect on where your time and attention are going each week — and how that aligns with the demands of your role.</p>
            <p className="text-gray-600 text-sm italic">It's not about judgment or performance. It's about awareness, alignment, and intentional growth.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">What to Expect</h2>
            <div className="space-y-3">
              {[
                "Each week, you'll complete a short check-in (2–3 minutes).",
                "You'll receive a simple snapshot of your leadership alignment, along with one focused prompt to guide your next step.",
              ].map((text, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: accentColor }} />
                  <p className="text-gray-700">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/60 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Let's get you set up</h2>
              <p className="text-sm text-gray-600 mt-1">(This will take less than a minute.)</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-900">Full Name</Label>
                <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} disabled={isSubmitting} className="h-11 border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-900">Role / Title</Label>
                <Input id="role" placeholder="e.g., VP of Strategy, Director of Operations" value={formData.role} onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))} disabled={isSubmitting} className="h-11 border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-900">Department <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input id="department" placeholder="Optional" value={formData.department} onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))} disabled={isSubmitting} className="h-11 border-gray-300" />
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
            <p className="text-sm text-gray-600 border-t border-gray-200/60 pt-6">This is a space for honest reflection. The value comes from consistency, not perfection.</p>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-11 text-base font-semibold" style={{ backgroundColor: accentColor }}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isSubmitting ? "Setting up..." : "Begin My First Check-In"}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">Your responses are private and used only to support your development.</div>
        </div>
      </main>
    </div>
  );
}