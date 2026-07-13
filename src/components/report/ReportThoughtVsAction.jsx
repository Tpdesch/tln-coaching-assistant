import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

export default function ReportThoughtVsAction({ required, actual, trend }) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Thought vs. Action</h2>
      <div className="report-tva-grid">
        {/* LEFT — Thought vs Action Alignment bars */}
        <div className="report-tva-col">
          <div className="report-diagnostic-tva-legend">
            <span className="report-diagnostic-tva-legend-item">
              <span className="report-diagnostic-tva-legend-dot report-diagnostic-tva-legend-dot-required" />
              Required
            </span>
            <span className="report-diagnostic-tva-legend-item">
              <span className="report-diagnostic-tva-legend-dot report-diagnostic-tva-legend-dot-actual" />
              Actual
            </span>
          </div>
          <div className="report-diagnostic-tva-list">
            {LEVELS.map((lvl) => {
              const req = required[`level_${lvl}`];
              const act = actual[`level_${lvl}`];
              const met = act >= req;
              return (
                <div key={lvl} className="report-diagnostic-tva-row">
                  <span className="report-diagnostic-tva-level">L{lvl}</span>
                  <div className="report-diagnostic-tva-bars">
                    <div className="report-diagnostic-tva-bar">
                      <div
                        className="report-diagnostic-tva-bar-fill-required"
                        style={{ width: `${req}%` }}
                      />
                    </div>
                    <div className="report-diagnostic-tva-bar">
                      <div
                        className={`report-diagnostic-tva-bar-fill-actual ${
                          met
                            ? "report-diagnostic-tva-bar-fill-actual-met"
                            : "report-diagnostic-tva-bar-fill-actual-gap"
                        }`}
                        style={{ width: `${act}%` }}
                      />
                    </div>
                  </div>
                  <span className="report-diagnostic-tva-pct">
                    {act}<span className="report-diagnostic-tva-pct-req"> / {req}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Weekly Alignment Trend */}
        <div className="report-tva-col">
          <table className="report-trend-table">
            <thead>
              <tr>
                <th>Week</th>
                <th className="report-trend-num">Alignment</th>
                <th className="report-trend-num">Gap</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((w) => (
                <tr key={w.week_label}>
                  <td>{w.week_label}</td>
                  <td className="report-trend-num">{w.alignment_score}</td>
                  <td className="report-trend-num">{w.thought_action_gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="report-divider" />
    </div>
  );
}