import React from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

const LEVEL_CONFIG = [
  { level: 1, label: "Transactional", color: "#C00000" },
  { level: 2, label: "Managerial", color: "#FFC000" },
  { level: 3, label: "Tactical", color: "#FFFF00" },
  { level: 4, label: "Strategic", color: "#00B050" },
  { level: 5, label: "Transformational", color: "#00B0F0" },
];

const LIKERT = ["Rarely", "Occasionally", "Sometimes", "Often", "Frequently"];

// Fallback texts used when a section cannot be parsed
const SECTION_FALLBACKS = {
  observation: "Your leadership pattern showed a notable signal this week.",
  meaning: "This pattern is worth exploring with your coach as a useful signal.",
  focus: "Notice one moment where your focus and actions feel most aligned.",
};

// Parse coach_reflection_text into labeled sections.
// Tries multiple label variants (with/without newline prefix, case-insensitive).
function parseCoachingText(text) {
  if (!text) return null;

  // Each entry: canonical key + all label strings to try (order matters — most specific first)
  const sectionDefs = [
    { key: "observation",  labels: ["Observation:"] },
    { key: "meaning",      labels: ["What This Means:", "Performance implication:"] },
    { key: "focus",        labels: ["Focus This Week:", "This week's challenge:", "Focus for Next Week:"] },
  ];

  // Find the start index of the first matching label (case-insensitive)
  function findLabel(src, labels) {
    for (const lbl of labels) {
      const re = new RegExp(lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const m = re.exec(src);
      if (m) return { idx: m.index, end: m.index + m[0].length };
    }
    return null;
  }

  // Locate all sections
  const found = sectionDefs.map(def => {
    const match = findLabel(text, def.labels);
    return match ? { key: def.key, start: match.idx, contentStart: match.end } : null;
  }).filter(Boolean).sort((a, b) => a.start - b.start);

  if (!found.length) {
    // No labels at all — split by double-newline and assign in order
    const parts = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
    return {
      observation: parts[0] || SECTION_FALLBACKS.observation,
      meaning:     parts[1] || SECTION_FALLBACKS.meaning,
      focus:       parts[2] || SECTION_FALLBACKS.focus,
    };
  }

  const sections = {};
  found.forEach((item, i) => {
    const nextStart = found[i + 1]?.start ?? text.length;
    sections[item.key] = text.slice(item.contentStart, nextStart).trim();
  });

  // Fill any missing section with fallback
  ["observation", "meaning", "focus"].forEach(k => {
    if (!sections[k]) sections[k] = SECTION_FALLBACKS[k];
  });

  return sections;
}

const METRIC_TOOLTIPS = {
  "Leadership Alignment": "Measures how consistently your actions align with your leadership focus.",
  "Growth Direction": "Tracks whether your leadership alignment is strengthening, holding steady, or drifting over recent check-ins.",
  "Thought vs Action": "Shows whether your leadership thinking is ahead of your actions, behind them, or balanced.",
};

function MetricInfo({ label }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const btnRef = React.useRef(null);
  const tooltip = METRIC_TOOLTIPS[label];
  if (!tooltip) return null;

  const show = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left + r.width / 2 });
    }
    setOpen(true);
  };

  return (
    <span className="inline-flex items-center ml-0.5">
      <button
        ref={btnRef}
        type="button"
        onClick={e => { e.stopPropagation(); show(); }}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        className="text-gray-400 hover:text-gray-700 focus:outline-none transition-colors"
        aria-label={`About ${label}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && typeof document !== "undefined" && React.createPortal(
        <span
          style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
          className="fixed z-[9999] w-48 bg-gray-900 text-white text-[11px] leading-snug rounded-lg px-2.5 py-2 shadow-lg pointer-events-none"
        >
          {tooltip}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
        </span>,
        document.body
      )}
    </span>
  );
}

function MetricCard({ label, value, desc, color, icon }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 w-[160px] shrink-0">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium text-center leading-tight flex items-center gap-0.5">
        {label}
        <MetricInfo label={label} />
      </span>
      <span className={`text-lg font-bold leading-tight flex items-center gap-1 mt-1 text-center ${color || "text-gray-800"}`}>
        {icon}
        {value}
      </span>
      {desc && <span className="text-[11px] text-gray-500 text-center mt-2 leading-snug">{desc}</span>}
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
  const alignmentDesc = aci == null ? "" : aci >= 75 ? "Your actions and focus remain well aligned." : aci >= 45 ? "Your actions and focus are generally aligned." : "Your actions and focus showed more variation this week.";

  const growthLabel = ams_direction === "improving" ? "Improving" : ams_direction === "declining" ? "Declining" : ams_direction === "emerging" ? "Emerging" : "Stable";
  const growthColor = ams_direction === "improving" ? "text-green-600" : ams_direction === "declining" ? "text-red-500" : ams_direction === "emerging" ? "text-slate-400" : "text-slate-500";
  const growthDesc = ams_direction === "improving" ? "Your recent leadership pattern is moving in a positive direction." : ams_direction === "declining" ? "Your recent leadership pattern shows some drift." : ams_direction === "emerging" ? "More check-ins are needed to identify a clear pattern." : "Your recent leadership pattern has remained steady.";

  const thoughtVsActionLabel = gap_direction === "thought_ahead" ? "Thought Ahead" : gap_direction === "action_ahead" ? "Action Ahead" : "Balanced";
  const thoughtVsActionColor = gap_direction === "thought_ahead" ? "text-amber-700" : gap_direction === "action_ahead" ? "text-orange-700" : "text-green-700";
  const thoughtVsActionDesc = gap_direction === "thought_ahead" ? "Your thinking is ahead of your visible action." : gap_direction === "action_ahead" ? "Your actions are ahead of your current thinking." : "Your thinking and actions are working together.";

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
              <div className="text-sm text-gray-400 mt-0.5 line-clamp-1 max-w-xs leading-snug">{sections.observation}</div>
            )}
          </div>

          {/* Metric cards — always visible */}
          <div className="flex items-stretch gap-2 flex-wrap">
            {aci != null && (
              <MetricCard label="Leadership Alignment" value={alignmentLabel} desc={alignmentDesc} color={alignmentColor} />
            )}
            {ams_score != null && (
              <MetricCard
                label="Growth Direction"
                value={growthLabel}
                desc={growthDesc}
                color={growthColor}
                icon={<AmsIcon direction={ams_direction} />}
              />
            )}
            {gap != null && (
              <MetricCard label="Thought vs Action" value={thoughtVsActionLabel} desc={thoughtVsActionDesc} color={thoughtVsActionColor} />
            )}
          </div>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-6 space-y-4 pt-4">

          {/* Coaching Insights — always three distinct stacked blocks */}
          {sections && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Observation</div>
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {sections.observation || SECTION_FALLBACKS.observation}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-2">What This Means</div>
                <p className="text-sm text-amber-900 leading-snug">
                  {sections.meaning || SECTION_FALLBACKS.meaning}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-2">Focus This Week</div>
                <p className="text-sm text-emerald-900 leading-snug">
                  {sections.focus || SECTION_FALLBACKS.focus}
                </p>
              </div>
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