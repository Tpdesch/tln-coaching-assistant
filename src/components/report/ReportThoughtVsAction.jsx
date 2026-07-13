import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

// The five Leadership Nexus report colors — one per level
const LEVEL_COLORS = [
  "hsl(12, 76%, 61%)",
  "hsl(173, 58%, 39%)",
  "hsl(197, 37%, 24%)",
  "hsl(43, 74%, 66%)",
  "hsl(27, 87%, 67%)",
];

export default function ReportThoughtVsAction({ thoughtAverages, actionAverages }) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Thought vs. Action</h2>
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
                {thought}<span className="report-diagnostic-tva-pct-req"> / {action}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="report-divider" />
    </div>
  );
}