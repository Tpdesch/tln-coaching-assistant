import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function ClientCheckIn() {
  const [profile, setProfile] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    action_l1: 3, action_l2: 3, action_l3: 3, action_l4: 3, action_l5: 3,
    thought_l1: 3, thought_l2: 3, thought_l3: 3, thought_l4: 3, thought_l5: 3,
    week_ending_date: format(new Date(), "yyyy-MM-dd"),
    reflection_text: "",
    commitment_text: "",
    wins: "",
    challenges: "",
    leadership_moments: [],
  });
  const [results, setResults] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me) { setError("Not authenticated."); setLoading(false); return; }
        const rows = await base44.entities.Profiles.filter({ base44_user_id: me.id });
        const p = Array.isArray(rows) ? rows[0] : null;
        if (!p) { setError("Profile not found. Please contact your coach."); setLoading(false); return; }
        setProfile(p);
        const clientRows = await base44.entities.Client.filter({ base44_user_id: me.id });
        const c = Array.isArray(clientRows) ? clientRows[0] : null;
        setClient(c || null);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Failed to load profile.");
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;
    try {
      setSubmitting(true);
      setError(null);
      let freeText = `Week Ending: ${form.week_ending_date}\n\nAction Time (1-5 frequency):\n`;
      freeText += `  Level 1: ${form.action_l1}\n  Level 2: ${form.action_l2}\n  Level 3: ${form.action_l3}\n  Level 4: ${form.action_l4}\n  Level 5: ${form.action_l5}\n`;
      freeText += `\nThought Time (1-5 frequency):\n`;
      freeText += `  Level 1: ${form.thought_l1}\n  Level 2: ${form.thought_l2}\n  Level 3: ${form.thought_l3}\n  Level 4: ${form.thought_l4}\n  Level 5: ${form.thought_l5}\n`;
      if (form.reflection_text) freeText += `\nReflection:\n${form.reflection_text}\n`;
      if (form.commitment_text) freeText += `\nCommitment:\n${form.commitment_text}\n`;
      if (form.wins) freeText += `\nWins:\n${form.wins}\n`;
      if (form.challenges) freeText += `\nChallenges:\n${form.challenges}\n`;

      const interaction = await base44.entities.Interactions.create({
        client_profile_id: profile.id,
        client_id: client?.id ?? null,
        type: "weekly_checkin",
        free_text: freeText,
        tags: ["weekly_checkin"],
        alignment_rating: null,
        stress_rating: null,
        share_with_coach: false,
        action_l1: form.action_l1, action_l2: form.action_l2, action_l3: form.action_l3, action_l4: form.action_l4, action_l5: form.action_l5,
        thought_l1: form.thought_l1, thought_l2: form.thought_l2, thought_l3: form.thought_l3, thought_l4: form.thought_l4, thought_l5: form.thought_l5,
        week_ending_date: form.week_ending_date,
        reflection_text: form.reflection_text,
        commitment_text: form.commitment_text,
      });

      const lnacRes = await base44.functions.invoke("invokeLnacEngine", { interaction_id: interaction.id });
      setResults(lnacRes.data);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to submit check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (error && !profile) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (success && results) {
    const computePct = (vals) => {
      const total = vals.reduce((s, v) => s + (v || 0), 0);
      if (!total) return {};
      return Object.fromEntries(vals.map((v, i) => [`l${i + 1}`, ((v || 0) / total) * 100]));
    };
    const action_pct = Object.keys(results?.action_pct || {}).length > 0 ? results.action_pct : computePct([form.action_l1, form.action_l2, form.action_l3, form.action_l4, form.action_l5]);
    const thought_pct = Object.keys(results?.thought_pct || {}).length > 0 ? results.thought_pct : computePct([form.thought_l1, form.thought_l2, form.thought_l3, form.thought_l4, form.thought_l5]);
    const aci = results?.aci;
    const aci_delta = results?.aci_delta;
    const coach_reflection_text = results?.coach_reflection_text;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/ClientHome" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Check-In Complete</h2>
              <p className="text-sm text-gray-600">Your weekly alignment insights</p>
            </div>
          </div>

          {aci != null && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="text-xs font-medium text-blue-900 mb-1">Alignment Trend</div>
              <div className="text-2xl font-bold text-blue-900">{aci.toFixed(0)}</div>
              {aci_delta != null && (
                <div className={`text-sm mt-0.5 ${aci_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {aci_delta >= 0 ? '↑' : '↓'} {Math.abs(aci_delta).toFixed(0)} from last week
                </div>
              )}
            </div>
          )}

          {coach_reflection_text && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-900">Coaching Insight</h3>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
                {coach_reflection_text.split("\n").map((line, i) => {
                  const boldLabels = ["Observation:", "Performance implication:", "This week's challenge:"];
                  const matchedLabel = boldLabels.find(l => line.startsWith(l));
                  if (matchedLabel) {
                    return (
                      <p key={i} className="text-sm text-slate-800 leading-relaxed">
                        <span className="font-bold">{matchedLabel}</span>{line.slice(matchedLabel.length)}
                      </p>
                    );
                  }
                  return <p key={i} className="text-sm text-slate-800 leading-relaxed">{line}</p>;
                })}
              </div>
            </div>
          )}

          {(client?.anchor_text || profile?.anchor_text) && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-900">Current Focus (Anchor)</h3>
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                <p className="text-sm text-purple-900 whitespace-pre-line">{(client?.anchor_text ? client : profile).anchor_text}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <Link to="/ClientHome">
              <Button className="w-full bg-amber-600 hover:bg-amber-700">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const levelConfig = [
    { level: 1, label: "Transactional (Level 1): Day-to-day operations, immediate tasks", color: "#C00000" },
    { level: 2, label: "Managerial (Level 2): Functional execution, specialized work", color: "#FFC000" },
    { level: 3, label: "Tactical (Level 3): Cross-functional coordination, short-term planning", color: "#FFFF00" },
    { level: 4, label: "Strategic (Level 4): Long-term initiatives, organizational direction", color: "#00B050" },
    { level: 5, label: "Transformational (Level 5): Vision-setting, industry-level impact", color: "#00B0F0" },
  ];

  const thoughtConfig = [
    { level: 1, label: "Transactional (Level 1): Immediate problems, reactive thinking", color: "#C00000" },
    { level: 2, label: "Managerial (Level 2): Specialized analysis, functional depth", color: "#FFC000" },
    { level: 3, label: "Tactical (Level 3): Integration across areas, near-term strategy", color: "#FFFF00" },
    { level: 4, label: "Strategic (Level 4): Future scenarios, organizational possibilities", color: "#00B050" },
    { level: 5, label: "Transformational (Level 5): Paradigm-shifting ideas, legacy thinking", color: "#00B0F0" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Weekly Check-In</h1>
        <p className="text-gray-600 mt-2">Track where your time and attention went this week across the 5 leadership levels.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Week Ending Date</Label>
          <Input type="date" value={form.week_ending_date} onChange={(e) => setForm({ ...form, week_ending_date: e.target.value })} className="max-w-xs" />
        </div>

        {/* Thought Time */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">This week, how frequently did you spend your Thought Time in the following ways?</Label>
          <div className="space-y-4">
            {thoughtConfig.map(({ level, label, color }) => (
              <div key={level} className="space-y-1.5">
                <div className="text-xs font-medium text-gray-700">{label}</div>
                <div className="space-y-1">
                  <Slider value={[form[`thought_l${level}`]]} onValueChange={(v) => setForm({ ...form, [`thought_l${level}`]: v[0] })} min={1} max={5} step={1} className="w-full" color={color} />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Rarely</span>
                    <span className="font-medium text-gray-500">{["Rarely","Occasionally","Sometimes","Often","Frequently"][form[`thought_l${level}`] - 1]}</span>
                    <span>Frequently</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Time */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">This week, how frequently did you spend your Action Time in the following ways?</Label>
          <div className="space-y-4">
            {levelConfig.map(({ level, label, color }) => (
              <div key={level} className="space-y-1.5">
                <div className="text-xs font-medium text-gray-700">{label}</div>
                <div className="space-y-1">
                  <Slider value={[form[`action_l${level}`]]} onValueChange={(v) => setForm({ ...form, [`action_l${level}`]: v[0] })} min={1} max={5} step={1} className="w-full" color={color} />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Rarely</span>
                    <span className="font-medium text-gray-500">{["Rarely","Occasionally","Sometimes","Often","Frequently"][form[`action_l${level}`] - 1]}</span>
                    <span>Frequently</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Anchor Reflection</Label>
          <Textarea value={form.reflection_text} onChange={(e) => setForm({ ...form, reflection_text: e.target.value })} placeholder="Reflect on your anchor focus this week..." maxLength={500} className="h-24 resize-none" />
          <div className="text-xs text-gray-500 mt-1 text-right">{form.reflection_text.length}/500</div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Commitment for Next Week</Label>
          <Input value={form.commitment_text} onChange={(e) => setForm({ ...form, commitment_text: e.target.value })} placeholder="What will you focus on next week?" className="w-full" />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Key wins this week</Label>
          <Textarea value={form.wins} onChange={(e) => setForm({ ...form, wins: e.target.value })} placeholder="What went well?" className="h-20" />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Key challenges this week</Label>
          <Textarea value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} placeholder="What was difficult?" className="h-20" />
        </div>

        {/* Leadership Moments */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Leadership Moments (Optional)</Label>
          <p className="text-xs text-gray-500 mb-3">Capture 1-2 key decision points where you chose how to focus your time/attention</p>
          {form.leadership_moments.map((moment, idx) => (
            <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-gray-700">Moment {idx + 1}</span>
                <button type="button" onClick={() => setForm({ ...form, leadership_moments: form.leadership_moments.filter((_, i) => i !== idx) })} className="text-xs text-red-600 hover:text-red-700">Remove</button>
              </div>
              <div className="space-y-2">
                {[
                  { key: "situation", placeholder: "What was happening?" },
                  { key: "choice_made", placeholder: "What level of response did you choose?" },
                  { key: "alternative", placeholder: "What other level response was available?" },
                  { key: "reflection", placeholder: "Looking back, was this the right choice?" },
                ].map(({ key, placeholder }) => (
                  <input key={key} type="text" placeholder={placeholder} value={moment[key] || ""} onChange={(e) => { const updated = [...form.leadership_moments]; updated[idx] = { ...updated[idx], [key]: e.target.value }; setForm({ ...form, leadership_moments: updated }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                ))}
              </div>
            </div>
          ))}
          {form.leadership_moments.length < 3 && (
            <button type="button" onClick={() => setForm({ ...form, leadership_moments: [...form.leadership_moments, { situation: "", choice_made: "", alternative: "", reflection: "" }] })} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
              + Add Leadership Moment
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button type="submit" disabled={submitting} className="w-full bg-amber-600 hover:bg-amber-700">
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitting ? "Analyzing Alignment..." : "Submit Check-In"}
        </Button>
      </form>
    </div>
  );
}