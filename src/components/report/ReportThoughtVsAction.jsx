import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

// Standardized series colors — same for every level
const THOUGHT_COLOR = "#1e3a5f"; // Leadership Nexus navy
const ACTION_COLOR = "#27ae60";  // Leadership Nexus green

// Official Leadership Nexus assessment level colors (L1–L5)
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];

export default function ReportThoughtVsAction({ thoughtAverages, actionAverages }) {
  return (
    <div className="report-diagnostic-col">
      <span className="report-diagnostic-col-label">Thought vs. Action</span>
      <div className="report-diagnostic-tva-legend">
        <span className="report-diagnostic-tva-legend-item">
          <span className="report-diagnostic-tva-legend-swatch" style={{ background: THOUGHT_COLOR }} />
          Thought
        </span>
        <span className="report-diagnostic-tva-legend-item">
          <span className="report-diagnostic-tva-legend-swatch" style={{ background: ACTION_COLOR, opacity: 0.4 }} />
          Action
        </span>
      </div>
      <div className="report-diagnostic-tva-list">
        {LEVELS.map((lvl, idx) => {
          const thought = thoughtAverages[`level_${lvl}`];
          const action = actionAverages[`level_${lvl}`];
          return (
            <div key={lvl} className="report-diagnostic-tva-row">
              <span className="report-diagnostic-tva-level" style={{ color: LEVEL_COLORS[idx], WebkitTextStroke: "0.5px rgba(0,0,0,0.35)" }}>L{lvl}</span>
              <div className="report-diagnostic-tva-bars">
                <div className="report-diagnostic-tva-bar">
                  <div
                    className="report-diagnostic-tva-bar-fill"
                    style={{ width: `${thought * 0.80}%`, background: THOUGHT_COLOR }}
                  />
                </div>
                <div className="report-diagnostic-tva-bar">
                  <div
                    className="report-diagnostic-tva-bar-fill"
                    style={{ width: `${action * 0.80}%`, background: ACTION_COLOR, opacity: 0.4 }}
                  />
                </div>
              </div>
              <span className="report-diagnostic-tva-pct">
                <span style={{ color: THOUGHT_COLOR, fontWeight: 700 }}>T {thought}</span>
                <span style={{ color: ACTION_COLOR, fontWeight: 700 }}> A {action}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}