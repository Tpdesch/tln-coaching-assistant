import React from "react";
import { monthlyReview } from "@/data/monthlyReviewMock";

export default function MonthlyLeadershipReview() {
  return (
    <div className="report-viewport">
      <div className="report-page">
        <div className="report-grid">
          <div className="col-span-12">
            <h1 className="report-title">Monthly Leadership Alignment Review</h1>
            <p className="report-placeholder">Report canvas connected to monthlyReview mock data.</p>
          </div>
          <div className="col-span-12">
            <p className="report-placeholder">Executive Summary: {monthlyReview.executive_summary}</p>
          </div>
          <div className="col-span-12">
            <p className="report-placeholder">
              Client Information: {monthlyReview.client_name} — {monthlyReview.client_title}, {monthlyReview.client_company}
            </p>
          </div>
        </div>
        <div className="report-grid-guides" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="report-grid-guide-col" />
          ))}
        </div>
      </div>
    </div>
  );
}