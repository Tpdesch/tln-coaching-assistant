import React from "react";
import { monthlyLeadershipBrief } from "@/data/monthlyReviewMock";

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
                <h1 className="report-title">Monthly Leadership Brief</h1>
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
                <span className="report-info-value">{monthlyLeadershipBrief.client_name}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Title</span>
                <span className="report-info-value">{monthlyLeadershipBrief.client_title}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Company</span>
                <span className="report-info-value">{monthlyLeadershipBrief.client_company}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Leadership Nexus Level</span>
                <span className="report-info-value report-info-value-accent">{monthlyLeadershipBrief.leadership_nexus_level}</span>
              </div>
            </div>
            <div className="report-info-row">
              <div className="report-info-item">
                <span className="report-info-label">Review Period</span>
                <span className="report-info-value">{monthlyLeadershipBrief.review_period}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Coach Name</span>
                <span className="report-info-value">{monthlyLeadershipBrief.coach_name}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Generated Date</span>
                <span className="report-info-value">{monthlyLeadershipBrief.generated_date}</span>
              </div>
            </div>
            <div className="report-divider" />
          </div>

          {/* Executive Summary */}
          <div className="col-span-12">
            <p className="report-placeholder">
              Executive Summary — {monthlyLeadershipBrief.executive_summary.headline}
              {" — "}
              {monthlyLeadershipBrief.executive_summary.narrative}
              {" (Confidence: "}
              {monthlyLeadershipBrief.executive_summary.confidence}
              {")"}
            </p>
          </div>

          {/* Leadership Alignment Snapshot */}
          <div className="col-span-12">
            <h2 className="report-section-title">Leadership Alignment Snapshot</h2>
            <div className="report-snapshot">
              <div className="report-snapshot-metric">
                <span className="report-snapshot-label">Leadership Alignment Score</span>
                <div className="report-snapshot-main">
                  <span className="report-snapshot-value">{monthlyLeadershipBrief.alignment_score}</span>
                  <span className="report-snapshot-delta">+{monthlyLeadershipBrief.alignment_score_delta}</span>
                </div>
                <span className="report-snapshot-sub">{monthlyLeadershipBrief.alignment_trend_direction}</span>
              </div>
              <div className="report-snapshot-metric">
                <span className="report-snapshot-label">Thought / Action Gap</span>
                <span className="report-snapshot-value">{monthlyLeadershipBrief.thought_action_gap}</span>
                <span className="report-snapshot-sub">{monthlyLeadershipBrief.thought_action_gap_label}</span>
              </div>
              <div className="report-snapshot-metric">
                <span className="report-snapshot-label">Current Leadership Level</span>
                <span className="report-snapshot-value report-snapshot-value-accent">{monthlyLeadershipBrief.leadership_nexus_level}</span>
                <span className="report-snapshot-sub">&nbsp;</span>
              </div>
            </div>
            <div className="report-divider" />
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