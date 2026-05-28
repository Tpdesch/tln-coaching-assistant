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

function MetricPill({ label, value, desc, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 min-w-[80px]">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <span className={`text-base font-bold leading-tight ${color || "text-gray-800"}`}>{value}</span>
      {desc && <span className="text-[8px] text-gray-500 text-center mt-0.5 leading-tight line-clamp-2">{desc}</span>}
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

  // Participant-friendly interpretations
  const alignmentLabel = aci == null ? null : aci >= 75 ? "Strong" : aci >= 45 ? "Moderate" : "Variable";
  const alignmentColor = aci == null ? "text-gray-800" : aci >= 75 ? "text-green-700" : aci >= 45 ? "text-amber-700" : "text-red-600";
  const alignmentDesc = aci == null ? "" : aci >= 75 ? "Your leadership focus and actions are working together consistently." : aci >= 45 ? "Your leadership is developing a consistent rhythm." : "Your focus and actions need better alignment.";

  const growthLabel = ams_direction === "improving" ? "Improving" : ams_direction === "declining" ? "Declining" : "Stable";
  const growthColor = ams_direction === "improving" ? "text-green-600" : ams_direction === "declining" ? "text-red-500" : "text-slate-500";
  const growthDesc = ams_direction === "improving" ? "Your alignment is moving in a positive direction." : ams_direction === "declining" ? "Your alignment is trending in a concerning direction." : "Your alignment remains consistent over time.";

  const thoughtVsActionLabel = gap_direction === "thought_ahead" ? "Thought Ahead" : gap_direction === "action_ahead" ? "Action Ahead" : "Balanced";
  const thoughtVsActionColor = gap_direction === "thought_ahead" ? "text-amber-700" : gap_direction === "action_ahead" ? "text-orange-700" : "text-green-700";
  const thoughtVsActionDesc = gap_direction === "thought_ahead" ? "Your strategic thinking is slightly ahead of your visible action." : gap_direction === "action_ahead" ? "Your actions are moving faster than your strategic alignment." : "Your thinking and actions are well-balanced.";

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
              <MetricPill label="Leadership Alignment" value={alignmentLabel} desc={alignmentDesc} color={alignmentColor} />
            )}
            {ams_score != null && (
              <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 min-w-[80px]">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Growth Direction</span>
                <span className={`text-sm font-bold leading-tight flex items-center gap-0.5 ${growthColor}`}>
                  <AmsIcon direction={ams_direction} />
                  {growthLabel}
                </span>
                <span className="text-[8px] text-gray-500 text-center mt-0.5 leading-tight line-clamp-2">{growthDesc}</span>
              </div>
            )}
            {gap != null && (
              <MetricPill label="Thought vs Action" value={thoughtVsActionLabel} desc={thoughtVsActionDesc} color={thoughtVsActionColor} />
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
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Observation</div>
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
                  <div className="text-xs font-medium text-gray-500 mb-1">Leadership Development Reflection</div>
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