import React from "react";

export default function ObservationRow({ children, isLast }) {
  return (
    <div className="report-observation-row">
      <p className="report-observation-text">{children}</p>
      {!isLast && <div className="report-observation-divider" />}
    </div>
  );
}