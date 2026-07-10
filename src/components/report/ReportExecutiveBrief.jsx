import React from "react";

export default function ReportExecutiveBrief({ data }) {
  const { leadership_snapshot, coaching_priority, desired_outcome } = data;
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Executive Brief</h2>
      <div className="report-brief">
        <div className="report-brief-field">
          <span className="report-brief-field-label">Leadership Snapshot</span>
          <p className="report-brief-field-text">{leadership_snapshot}</p>
        </div>
        <div className="report-brief-field">
          <span className="report-brief-field-label">Coaching Priority</span>
          <p className="report-brief-field-text">{coaching_priority}</p>
        </div>
        <div className="report-brief-field">
          <span className="report-brief-field-label">Desired Outcome</span>
          <p className="report-brief-field-text">{desired_outcome}</p>
        </div>
      </div>
      <div className="report-divider" />
    </div>
  );
}