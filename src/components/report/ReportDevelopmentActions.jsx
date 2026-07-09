import React from "react";

export default function ReportDevelopmentActions({ recommendation, secondaryFocus }) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Development Actions</h2>
      <div className="report-dev-action">
        <span className="report-dev-action-label">Growth Recommendation</span>
        <p className="report-dev-action-text">{recommendation}</p>
      </div>
      {secondaryFocus && (
        <div className="report-dev-action">
          <span className="report-dev-action-label report-dev-action-label-secondary">Secondary Focus</span>
          <p className="report-dev-action-text">{secondaryFocus}</p>
        </div>
      )}
    </div>
  );
}