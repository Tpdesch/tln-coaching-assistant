import React from "react";

const CLASSIFICATION_CLASS = {
  Strength: "",
  Emerging: "report-diagnostic-pattern-classification-emerging",
  Watch: "report-diagnostic-pattern-classification-watch",
};

export default function ReportPatternsThisMonth({ leadershipPattern, leadershipMomentum }) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Patterns This Month</h2>
      <div className="report-patterns">
        <div className="report-diagnostic-col">
          <span className="report-diagnostic-col-label">Leadership Pattern</span>
          <p className="report-diagnostic-pattern-title">{leadershipPattern.title}</p>
          <p className="report-diagnostic-pattern-explanation">{leadershipPattern.explanation}</p>
          <span
            className={`report-diagnostic-pattern-classification ${
              CLASSIFICATION_CLASS[leadershipPattern.classification] || ""
            }`}
          >
            {leadershipPattern.classification}
          </span>
        </div>
        <div className="report-diagnostic-col">
          <span className="report-diagnostic-col-label">Leadership Momentum</span>
          <span className="report-diagnostic-momentum-indicator">{leadershipMomentum.indicator}</span>
          <p className="report-diagnostic-momentum-interpretation">{leadershipMomentum.interpretation}</p>
        </div>
      </div>
      <div className="report-divider" />
    </div>
  );
}