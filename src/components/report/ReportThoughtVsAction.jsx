import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

// The five Leadership Nexus report colors — one per level
const LEVEL_COLORS = [
  "#e74c3c", // L1 — red
  "#e67e22", // L2 — orange
  "#f1c40f", // L3 — yellow
  "#27ae60", // L4 — green
  "#2980b9", // L5 — blue
];

export default function ReportThoughtVsAction({ thoughtAverages, actionAverages }) {
  return (
    <div className="report-diagnostic-col">
      <span className="report-diagnostic-col-label">Thought vs. Action</span>
      <div className="report-diagnostic-tva-legend">
        <span className="report-diagnostic-tva-legend-item">
          <span className="report-diagnostic-tva-legend-dot" style={{ background: "#1e3a5f" }} />
          Thought
        </span>
        <span className="report-diagnostic-tva-legend-item">
          <span className="report-diagnostic-tva-legend-dot" style={{ background: "#1e3a5f", opacity: 0.4 }} />
          Action
        </span>
      </div>
      <div className="report-diagnostic-tva-list">
        {LEVELS.map((lvl, idx) => {
          const thought = thoughtAverages[`level_${lvl}`];
          const action = actionAverages[`level_${lvl}`];
          const color = LEVEL_COLORS[idx];
          return (
            <div key={lvl} className="report-diagnostic-tva-row">
              <span className="report-diagnostic-tva-level">L{lvl}</span>
              <div className="report-diagnostic-tva-bars">
                <div className="report-diagnostic-tva-bar">
                  <div
                    className="report-diagnostic-tva-bar-fill"
                    style={{ width: `${thought}%`, background: color }}
                  />
                </div>
                <div className="report-diagnostic-tva-bar">
                  <div
                    className="report-diagnostic-tva-bar-fill"
                    style={{ width: `${action}%`, background: color, opacity: 0.4 }}
                  />
                </div>
              </div>
              <span className="report-diagnostic-tva-pct">
                {thought}%<span className="report-diagnostic-tva-pct-req"> / {action}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}