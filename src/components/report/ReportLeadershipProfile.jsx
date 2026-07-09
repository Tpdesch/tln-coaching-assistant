import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

export default function ReportLeadershipProfile({ required, actual }) {
  return (
    <div className="col-span-7">
      <h2 className="report-section-title">Leadership Profile Distribution</h2>
      <div className="report-profile-grid">
        <span className="report-profile-header">Level</span>
        <span className="report-profile-header">Required</span>
        <span className="report-profile-header">Actual</span>
        {LEVELS.map(lvl => (
          <React.Fragment key={lvl}>
            <span className="report-profile-level">Level {lvl}</span>
            <div className="report-profile-bar">
              <div className="report-profile-bar-required" style={{ width: `${required[`level_${lvl}`]}%` }} />
            </div>
            <div className="report-profile-bar">
              <div className="report-profile-bar-actual" style={{ width: `${actual[`level_${lvl}`]}%` }} />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}