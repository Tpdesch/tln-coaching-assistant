import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

// Standardized series colors — same for every level
const THOUGHT_COLOR = "#1e3a5f"; // Leadership Nexus navy
const ACTION_COLOR = "#27ae60";  // Leadership Nexus green

export default function ReportThoughtVsAction({ thoughtAverages, actionAverages }) {
  return (
    <div className="report-diagnostic-col">
      <span className="report-diagnostic-col-label">Thought vs. Action</span>
      <div className="report-diagnostic-tva-headers">
        <span className="report-diagnostic-tva-header-spacer" />
        <span className="report-diagnostic-tva-header-label">Thought</span>
        <span className="report-diagnostic-tva-header-label">Action</span>
        <span className="report-diagnostic-tva-header-spacer" />
      </div>
      <div className="report-diagnostic-tva-list">
        {LEVELS.map((lvl, idx) => {
          const thought = thoughtAverages[`level_${lvl}`];
          const action = actionAverages[`level_${lvl}`];
          return (
            <div key={lvl} className="report-diagnostic-tva-row">
              <span className="report-diagnostic-tva-level">L{lvl}</span>
              <div className="report-diagnostic-tva-bars">
                <div className="report-diagnostic-tva-bar">
                  <div
                    className="report-diagnostic-tva-bar-fill"
                    style={{ width: `${thought * 0.95}%`, background: THOUGHT_COLOR }}
                  />
                </div>
                <div className="report-diagnostic-tva-bar">
                  <div
                    className="report-diagnostic-tva-bar-fill"
                    style={{ width: `${action * 0.95}%`, background: ACTION_COLOR, opacity: 0.4 }}
                  />
                </div>
              </div>
              <span className="report-diagnostic-tva-pct">
                {thought}<span className="report-diagnostic-tva-pct-req"> / {action}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}