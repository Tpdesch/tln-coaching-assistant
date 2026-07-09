import React from "react";

export default function ReportCoachingFocus({ whatsWorking, watchOutFor, primaryFocus, primaryFocusExplanation }) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Coaching Priorities</h2>
      <div className="report-focus-grid">
        <div className="report-focus-item">
          <span className="report-focus-label report-focus-label-positive">What's Working</span>
          <p className="report-focus-text">{whatsWorking}</p>
        </div>
        <div className="report-focus-item">
          <span className="report-focus-label report-focus-label-caution">Watch Out For</span>
          <p className="report-focus-text">{watchOutFor}</p>
        </div>
      </div>
      <div className="report-primary-focus">
        <p className="report-primary-focus-title">{primaryFocus}</p>
        <p className="report-primary-focus-explanation">{primaryFocusExplanation}</p>
      </div>
      <div className="report-divider" />
    </div>
  );
}