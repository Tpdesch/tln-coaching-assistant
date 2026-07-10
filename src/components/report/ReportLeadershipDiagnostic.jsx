import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

const CLASSIFICATION_CLASS = {
  Strength: "",
  Emerging: "report-diagnostic-pattern-classification-emerging",
  Watch: "report-diagnostic-pattern-classification-watch",
};

export default function ReportLeadershipDiagnostic({
  leadershipPattern,
  required,
  actual,
  leadershipMomentum,
  primaryDevelopmentPattern,
}) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Leadership Diagnostic</h2>
      <div className="report-diagnostic">
        {/* LEFT COLUMN — Leadership Pattern */}
        <div className="report-diagnostic-col">
          <span className="report-diagnostic-col-label">Leadership Pattern</span>
          <p className="report-diagnostic-pattern-title">{leadershipPattern.title}</p>
          <p className="report-diagnostic-pattern-explanation">
            {leadershipPattern.explanation}
          </p>
          <span
            className={`report-diagnostic-pattern-classification ${
              CLASSIFICATION_CLASS[leadershipPattern.classification] || ""
            }`}
          >
            {leadershipPattern.classification}
          </span>
        </div>

        {/* CENTER COLUMN — Thought vs Action Alignment */}
        <div className="report-diagnostic-col">
          <span className="report-diagnostic-col-label">Thought vs Action Alignment</span>
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

        {/* RIGHT COLUMN — Leadership Momentum + Primary Development Pattern */}
        <div className="report-diagnostic-col">
          <span className="report-diagnostic-col-label">Leadership Momentum</span>
          <span className="report-diagnostic-momentum-indicator">
            {leadershipMomentum.indicator}
          </span>
          <p className="report-diagnostic-momentum-interpretation">
            {leadershipMomentum.interpretation}
          </p>

          <div className="report-diagnostic-pdp-divider" />
          <span className="report-diagnostic-pdp-label">Primary Development Pattern</span>
          <p className="report-diagnostic-pdp-title">{primaryDevelopmentPattern.title}</p>
          <p className="report-diagnostic-pdp-explanation">
            {primaryDevelopmentPattern.explanation}
          </p>
        </div>
      </div>
      <div className="report-divider" />
    </div>
  );
}