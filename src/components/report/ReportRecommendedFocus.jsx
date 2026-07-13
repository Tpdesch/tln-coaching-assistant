import React from "react";

function PracticeColumn({ label, practice }) {
  return (
    <div className="report-practices-col">
      <span className="report-practices-col-label">{label}</span>
      <p className="report-practices-title">{practice.title}</p>
      <div className="report-practices-field">
        <span className="report-practices-field-label">Purpose</span>
        <p className="report-practices-field-text">{practice.purpose}</p>
      </div>
      <div className="report-practices-field">
        <span className="report-practices-field-label">Leadership Practice</span>
        <p className="report-practices-field-text">{practice.practice}</p>
      </div>
      <div className="report-practices-field">
        <span className="report-practices-field-label">Reflection Question</span>
        <p className="report-practices-field-text report-practices-field-text-emphasis">
          {practice.reflection_question}
        </p>
      </div>
    </div>
  );
}

export default function ReportRecommendedFocus({ primary, supporting, growth }) {
  return (
    <div className="col-span-12">
      <h2 className="report-section-title">Recommended Focus</h2>
      <div className="report-practices-grid">
        <PracticeColumn label="Primary Leadership Practice" practice={primary} />
        <PracticeColumn label="Supporting Leadership Practice" practice={supporting} />
        <PracticeColumn label="Growth Practice" practice={growth} />
      </div>
      <div className="report-divider" />
    </div>
  );
}