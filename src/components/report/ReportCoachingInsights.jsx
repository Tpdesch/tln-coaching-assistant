import React from "react";

export default function ReportCoachingInsights({ strengthsToBuildOn, emergingRisks }) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Coaching Insights</h2>
      <div className="report-insights-grid">
        <div className="report-insights-col">
          <span className="report-insights-col-title">Strengths To Build On</span>
          <ul className="report-insights-list">
            {strengthsToBuildOn.map((observation, idx) => (
              <li key={idx} className="report-insights-item">
                <span className="report-insights-marker report-insights-marker-strength" />
                <span className="report-insights-text">{observation}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="report-insights-col">
          <span className="report-insights-col-title">Emerging Risks</span>
          <ul className="report-insights-list">
            {emergingRisks.map((observation, idx) => (
              <li key={idx} className="report-insights-item">
                <span className="report-insights-marker report-insights-marker-risk" />
                <span className="report-insights-text">{observation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="report-divider" />
    </div>
  );
}