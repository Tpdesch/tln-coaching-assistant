import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

const THOUGHT_COLOR = "#1e3a5f"; // Leadership Nexus navy
const ACTION_COLOR = "#27ae60";  // Leadership Nexus green

const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];

export default function ReportThoughtVsAction({ thoughtAverages, actionAverages }) {
  return (
    <div className="report-diagnostic-col">
      <span className="report-diagnostic-col-label">Thought vs. Action</span>
      <div className="report-tva-chart-body">
        <div className="report-diagnostic-tva-list">
          {LEVELS.map((lvl, idx) => {
            const thought = thoughtAverages[`level_${lvl}`];
            const action = actionAverages[`level_${lvl}`];
            return (
              <div key={lvl} className="report-diagnostic-tva-row">
                <span className="report-diagnostic-tva-level" style={{ color: LEVEL_COLORS[idx], WebkitTextStroke: "0.5px rgba(0,0,0,0.35)" }}>L{lvl}</span>
                <div className="report-diagnostic-tva-bars">
                  <div className="report-diagnostic-tva-bar">
                    <div className="report-diagnostic-tva-bar-fill" style={{ width: `${thought}%`, background: THOUGHT_COLOR }} />
                  </div>
                  <div className="report-diagnostic-tva-bar">
                    <div className="report-diagnostic-tva-bar-fill" style={{ width: `${action}%`, background: ACTION_COLOR }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <img className="report-tva-print-img" alt="" />
    </div>
  );
}