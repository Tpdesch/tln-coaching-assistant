import React, { useEffect } from "react";

const LEVELS = [1, 2, 3, 4, 5];

const THOUGHT_COLOR = "#1e3a5f"; // Leadership Nexus navy
const ACTION_COLOR = "#27ae60";  // Leadership Nexus green

// Official Leadership Nexus assessment level colors (L1–L5)
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];

const EXPECTED_MAX = 5; // Likert scale maximum

export default function ReportThoughtVsAction({ thoughtAverages, actionAverages }) {
  useEffect(() => {
    console.group("=== Thought vs. Action — TVA Data Inspection ===");
    console.log("Input scale: 1–5 Likert (slider min=1, max=5, step=1)");
    console.log("EXPECTED_MAX:", EXPECTED_MAX);
    console.log("thoughtAverages (raw):", thoughtAverages);
    console.log("actionAverages (raw):", actionAverages);
    LEVELS.forEach((lvl) => {
      const rawThought = thoughtAverages[`level_${lvl}`];
      const rawAction = actionAverages[`level_${lvl}`];
      const thoughtPct = (rawThought / EXPECTED_MAX) * 100;
      const actionPct = (rawAction / EXPECTED_MAX) * 100;
      const thoughtCssWidth = `${rawThought}%`;
      const actionCssWidth = `${rawAction}%`;
      console.log(`--- L${lvl} ---`);
      console.log(`  raw Thought score:       ${rawThought}`);
      console.log(`  raw Action score:         ${rawAction}`);
      console.log(`  expected maximum score:   ${EXPECTED_MAX}`);
      console.log(`  calc Thought % (raw/5):   ${thoughtPct.toFixed(1)}%`);
      console.log(`  calc Action % (raw/5):     ${actionPct.toFixed(1)}%`);
      console.log(`  ACTUAL CSS width Thought: ${thoughtCssWidth}`);
      console.log(`  ACTUAL CSS width Action:  ${actionCssWidth}`);
      console.log(`  ⚠ Thought bar fill uses raw value as % — ${rawThought}% instead of ${thoughtPct.toFixed(1)}%`);
      console.log(`  ⚠ Action bar fill uses raw value as %  — ${rawAction}% instead of ${actionPct.toFixed(1)}%`);
    });
    console.groupEnd();
  }, [thoughtAverages, actionAverages]);

  return (
    <div className="report-diagnostic-col">
      <span className="report-diagnostic-col-label report-tva-title">Thought vs. Action</span>
      <div className="report-tva-chart">
        {LEVELS.map((lvl, idx) => {
          const thought = thoughtAverages[`level_${lvl}`];
          const action = actionAverages[`level_${lvl}`];
          return (
            <div key={lvl} className="report-tva-group">
              <span
                className="report-tva-level"
                style={{ color: LEVEL_COLORS[idx], WebkitTextStroke: "0.6px rgba(0,0,0,0.45)" }}
              >
                L{lvl}
              </span>
              <span className="report-tva-track-label">Thought</span>
              <div className="report-tva-track">
                <div className="report-tva-track-fill" style={{ width: `${thought}%`, background: THOUGHT_COLOR }} />
              </div>
              <span className="report-tva-track-label">Action</span>
              <div className="report-tva-track">
                <div className="report-tva-track-fill" style={{ width: `${action}%`, background: ACTION_COLOR }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}