import React from "react";

export default function ReportExecutiveSummary({ data }) {
  const { headline, narrative, confidence } = data;
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Executive Summary</h2>
      <p className="report-summary-headline">{headline}</p>
      <p className="report-summary-narrative">{narrative}</p>
      <span className="report-summary-confidence">Confidence: {confidence}</span>
      <div className="report-divider" />
    </div>
  );
}