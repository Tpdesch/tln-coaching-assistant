import React from "react";
import ObservationRow from "@/components/report/ObservationRow";

export default function ReportWatchOutFor({ items }) {
  return (
    <div className="report-insights-col">
      <h2 className="report-insights-col-title">Watch Out For</h2>
      <div className="report-observation-stack">
        {items.map((observation, idx) => (
          <ObservationRow key={idx} isLast={idx === items.length - 1}>
            {observation}
          </ObservationRow>
        ))}
      </div>
    </div>
  );
}