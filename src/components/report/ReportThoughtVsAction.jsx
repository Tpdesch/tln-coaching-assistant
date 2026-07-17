import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

const THOUGHT_COLOR = "#1e3a5f"; // Leadership Nexus navy
const ACTION_COLOR = "#27ae60";  // Leadership Nexus green

// Official Leadership Nexus assessment level colors (L1–L5)
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];

export default function ReportThoughtVsAction({ thoughtAverages, actionAverages }) {
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