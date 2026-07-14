import React from "react";

export default function ReportExecutiveSummary({ data }) {
  const { headline, narrative } = data;
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Executive Summary</h2>
      <p className="report-summary-headline">{headline}</p>
      <p className="report-summary-narrative">{narrative}</p>
      <div className="report-divider" />
    </div>
  );
}