import React from "react";

export default function ReportMonthlyTrend({ trend }) {
  return (
    <div className="col-span-5">
      <h2 className="report-section-title">Weekly Alignment Trend</h2>
      <table className="report-trend-table">
        <thead>
          <tr>
            <th>Week</th>
            <th className="report-trend-num">Alignment</th>
            <th className="report-trend-num">Gap</th>
          </tr>
        </thead>
        <tbody>
          {trend.map(w => (
            <tr key={w.week_label}>
              <td>{w.week_label}</td>
              <td className="report-trend-num">{w.alignment_score}</td>
              <td className="report-trend-num">{w.thought_action_gap}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}