import React from "react";
import { monthlyReview } from "@/data/monthlyReviewMock";

export default function MonthlyLeadershipReview() {
  return (
    <div className="report-viewport">
      <div className="report-page">
        <div className="report-grid">
          {/* Three-column header */}
          <div className="col-span-12">
            <div className="report-header">
              <div className="report-header-left">
                <span className="report-logo-placeholder">Leadership Nexus</span>
              </div>
              <div className="report-header-center">
                <h1 className="report-title">Monthly Leadership Alignment Review</h1>
              </div>
              <div className="report-header-right">
                <span className="report-logo-placeholder">Jamesson Solutions</span>
              </div>
            </div>
          </div>

          {/* Client information + report metadata block */}
          <div className="col-span-12">
            <div className="report-divider" />
            <div className="report-info-row">
              <div className="report-info-item">
                <span className="report-info-label">Client Name</span>
                <span className="report-info-value">{monthlyReview.client_name}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Title</span>
                <span className="report-info-value">{monthlyReview.client_title}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Company</span>
                <span className="report-info-value">{monthlyReview.client_company}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Leadership Nexus Level</span>
                <span className="report-info-value report-info-value-accent">{monthlyReview.leadership_nexus_level}</span>
              </div>
            </div>
            <div className="report-info-row">
              <div className="report-info-item">
                <span className="report-info-label">Review Period</span>
                <span className="report-info-value">{monthlyReview.review_period}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Coach Name</span>
                <span className="report-info-value">{monthlyReview.coach_name}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Generated Date</span>
                <span className="report-info-value">{monthlyReview.generated_date}</span>
              </div>
            </div>
            <div className="report-divider" />
          </div>

          {/* Executive Summary placeholder */}
          <div className="col-span-12">
            <p className="report-placeholder">Executive Summary: {monthlyReview.executive_summary}</p>
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