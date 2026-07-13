import React from "react";

export default function ReportWhatsWorking({ items }) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">What's Working</h2>
      <ul className="report-insights-list">
        {items.map((observation, idx) => (
          <li key={idx} className="report-insights-item">
            <span className="report-insights-marker report-insights-marker-strength" />
            <span className="report-insights-text">{observation}</span>
          </li>
        ))}
      </ul>
      <div className="report-divider" />
    </div>
  );
}