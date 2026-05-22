import React from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";

const LEVEL_CONFIG = [
  { level: 1, label: "Transactional", color: "#C00000" },
  { level: 2, label: "Managerial", color: "#FFC000" },
  { level: 3, label: "Tactical", color: "#FFFF00" },
  { level: 4, label: "Strategic", color: "#00B050" },
  { level: 5, label: "Transformational", color: "#00B0F0" },
];

const LIKERT = ["Rarely", "Occasionally", "Sometimes", "Often", "Frequently"];

// Parse coach_reflection_text into labeled sections
function parseCoachingText(text) {
  if (!text) return null;
  const sectionKeys = [
    { label: "Observation:", key: "observation" },
    { label: "Performance implication:", key: "meaning" },
    { label: "This week's challenge:", key: "focus" },
  ];

  const sections = {};
  let remaining = text;

  for (let i = 0; i < sectionKeys.length; i++) {
    const { label, key } = sectionKeys[i];
    const idx = remaining.indexOf(label);
    if (idx === -1) continue;
    const nextIdx = sectionKeys
      .slice(i + 1)
      .map(s => remaining.indexOf(s.label))
      .find(n => n > idx) ?? remaining.length;
    sections[key] = remaining.slice(idx + label.length, nextIdx).trim();
  }

  // Fallback: if no sections matched, treat whole text as observation
  if (!Object.keys(sections).length) sections.observation = text.trim();

  return sections;
}

function MetricPill({ label, value, sub, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 min-w-[72px]">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <span className={`text-base font-bold leading-tight ${color || "text-gray-800"}`}>{value}</span>
      {sub && <span className="text-[10px] text-gray-400">{sub}</span>}
    </div>
  );
}

function AmsIcon({ direction }) {
  if (direction === "improving") return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
  if (direction === "declining") return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}

export default function CheckInResultCard({ interaction, inferenceRun, defaultExpanded = false }) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const aci = inferenceRun?.aci;
  const aci_delta = inferenceRun?.aci_delta;
  const coach_reflection_text = inferenceRun?.coach_reflection_text;
  const ams_score = interaction.alignment_momentum_score;
  const ams_direction = interaction.alignment_momentum_direction;
  const gap = interaction.leadership_gap;
  const gap_direction = interaction.leadership_gap_direction;

  const sections = parseCoachingText(coach_reflection_text);

  const gapColor = gap > 0 ? "text-amber-700" : gap < 0 ? "text-orange-700" : "text-green-700";
  const gapLabel = gap_direction === "thought_ahead" ? "Thought ahead" : gap_direction === "action_ahead" ? "Action ahead" : "Aligned";
  const amsColor = ams_direction === "improving" ? "text-green-600" : ams_direction === "declining" ? "text-red-500" : "text-slate-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Week ending {interaction.week_ending_date || interaction.created_date?.slice(0, 10)}
            </div>
            {sections?.observation && !expanded && (
              <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">{sections.observation}</div>
            )}
          </div>

          {/* Compact metric pills — always visible */}
          <div className="flex items-center gap-2 flex-wrap">
            {aci != null && (
              <MetricPill
                label="ACI"
                value={aci.toFixed(0)}
                sub={aci_delta != null ? `${aci_delta >= 0 ? "↑" : "↓"}${Math.abs(aci_delta).toFixed(0)}` : null}
                color={aci_delta != null ? (aci_delta >= 0 ? "text-green-700" : "text-red-600") : "text-gray-800"}
              />
            )}
            {gap != null && (
              <MetricPill label="Gap" value={gap > 0 ? `+${gap}` : `${gap}`} sub={gapLabel} color={gapColor} />
            )}
            {ams_score != null && (
              <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 min-w-[72px]">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">AMS</span>
                <span className={`text-base font-bold leading-tight flex items-center gap-0.5 ${amsColor}`}>
                  <AmsIcon direction={ams_direction} />
                  {ams_score > 0 ? `+${ams_score.toFixed(0)}` : ams_score.toFixed(0)}
                </span>
                <span className="text-[10px] text-gray-400 capitalize">{ams_direction}</span>
              </div>
            )}
          </div>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-6 space-y-4 pt-4">

          {/* Primary Insight - Prominent at Top */}
          {sections?.observation && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-base font-semibold text-slate-900 leading-relaxed">{sections.observation}</p>
            </div>
          )}

          {/* Supporting Insights */}
          {(sections?.meaning || sections?.focus) && (
            <div className="space-y-3">
              {sections.meaning && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-1">What This Means</div>
                  <p className="text-sm text-amber-900 leading-relaxed">{sections.meaning}</p>
                </div>
              )}
              {sections.focus && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-1">Focus for Next Week</div>
                  <p className="text-sm text-emerald-900 leading-relaxed">{sections.focus}</p>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Level bars: Action + Thought side by side */}
          <div className="grid grid-cols-2 gap-4">
            {["Action", "Thought"].map(type => (
              <div key={type}>
                <div className="text-xs font-medium text-gray-500 mb-2">{type} Time</div>
                <div className="space-y-2">
                  {LEVEL_CONFIG.map(({ level, label, color }) => {
                    const key = `${type.toLowerCase()}_l${level}`;
                    const rawLikert = interaction[key] ?? 1;
                    const likertIdx = Math.min(4, Math.max(0, rawLikert - 1));
                    return (
                      <div key={level}>
                        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                          <span>L{level} {label}</span>
                          <span>{LIKERT[likertIdx]}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[0,1,2,3,4].map(i => (
                            <div key={i} className="flex-1 h-2 rounded-sm" style={{ backgroundColor: color, opacity: i <= likertIdx ? 1 : 0.12, outline: "1px solid rgba(0,0,0,0.15)" }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Reflection + Commitment */}
          {(interaction.reflection_text || interaction.commitment_text) && (
            <div className="space-y-3">
              {interaction.reflection_text && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Anchor Reflection</div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">{interaction.reflection_text}</p>
                </div>
              )}
              {interaction.commitment_text && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Commitment for Next Week</div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{interaction.commitment_text}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}