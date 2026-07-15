import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

const THOUGHT_COLOR = "#1e3a5f";
const ACTION_COLOR = "#27ae60";
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];

// All dimensions in fixed pixels — no percentages, no responsive behavior
const BAR_MAX_W = 180;

export default function ReportThoughtVsActionPrint({ thoughtAverages, actionAverages }) {
  return (
    <div className="report-tva-print">
      <div className="report-tva-print-label">Thought vs. Action</div>

      <div className="report-tva-print-legend">
        <span className="report-tva-print-legend-item">
          <span className="report-tva-print-swatch" style={{ background: THOUGHT_COLOR }} />
          Thought
        </span>
        <span className="report-tva-print-legend-item">
          <span className="report-tva-print-swatch" style={{ background: ACTION_COLOR, opacity: 0.4 }} />
          Action
        </span>
      </div>

      {LEVELS.map((lvl, idx) => {
        const thought = thoughtAverages[`level_${lvl}`];
        const action = actionAverages[`level_${lvl}`];
        const thoughtBarW = (thought / 100) * BAR_MAX_W * 0.80;
        const actionBarW = (action / 100) * BAR_MAX_W * 0.80;

        return (
          <div key={lvl} className="report-tva-print-row">
            <span className="report-tva-print-level" style={{ color: LEVEL_COLORS[idx] }}>
              L{lvl}
            </span>
            <div className="report-tva-print-bars">
              <div className="report-tva-print-bar">
                <div
                  className="report-tva-print-bar-fill"
                  style={{ width: `${thoughtBarW}px`, background: THOUGHT_COLOR }}
                />
              </div>
              <div className="report-tva-print-bar">
                <div
                  className="report-tva-print-bar-fill"
                  style={{ width: `${actionBarW}px`, background: ACTION_COLOR, opacity: 0.4 }}
                />
              </div>
            </div>
            <span className="report-tva-print-value">
              <span style={{ color: THOUGHT_COLOR }}>T {thought}</span>
              <span style={{ color: ACTION_COLOR }}> A {action}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}