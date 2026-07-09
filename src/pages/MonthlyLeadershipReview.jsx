import React from "react";
import { monthlyLeadershipBrief as brief } from "@/data/monthlyReviewMock";
import ReportExecutiveSummary from "@/components/report/ReportExecutiveSummary";
import ReportLeadershipProfile from "@/components/report/ReportLeadershipProfile";
import ReportMonthlyTrend from "@/components/report/ReportMonthlyTrend";
import ReportCoachingFocus from "@/components/report/ReportCoachingFocus";
import ReportDevelopmentActions from "@/components/report/ReportDevelopmentActions";

export default function MonthlyLeadershipReview() {
  return (
    <div className="report-viewport">
      <div className="report-page">
        <div className="report-grid">
          {/* CONTEXT: Three-column header */}
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

          {/* CONTEXT: Client information + report metadata */}
          <div className="col-span-12">
            <div className="report-divider" />
            <div className="report-info-row">
              <div className="report-info-item">
                <span className="report-info-label">Client Name</span>
                <span className="report-info-value">{brief.client_name}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Title</span>
                <span className="report-info-value">{brief.client_title}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Company</span>
                <span className="report-info-value">{brief.client_company}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Leadership Nexus Level</span>
                <span className="report-info-value report-info-value-accent">{brief.leadership_nexus_level}</span>
              </div>
            </div>
            <div className="report-info-row">
              <div className="report-info-item">
                <span className="report-info-label">Review Period</span>
                <span className="report-info-value">{brief.review_period}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Coach Name</span>
                <span className="report-info-value">{brief.coach_name}</span>
              </div>
              <div className="report-info-item">
                <span className="report-info-label">Generated Date</span>
                <span className="report-info-value">{brief.generated_date}</span>
              </div>
            </div>
            <div className="report-divider" />
          </div>

          {/* CONTEXT → INSIGHT: Executive Summary */}
          <ReportExecutiveSummary data={brief.executive_summary} />

          {/* INSIGHT: Leadership Alignment Snapshot */}
          <div className="col-span-12">
            <h2 className="report-section-title">Leadership Alignment Snapshot</h2>
            <div className="report-snapshot">
              <div className="report-snapshot-metric">
                <span className="report-snapshot-label">Leadership Alignment Score</span>
                <div className="report-snapshot-main">
                  <span className="report-snapshot-value">{brief.alignment_score}</span>
                  <span className="report-snapshot-delta">+{brief.alignment_score_delta}</span>
                </div>
                <span className="report-snapshot-sub">{brief.alignment_trend_direction}</span>
              </div>
              <div className="report-snapshot-metric">
                <span className="report-snapshot-label">Thought / Action Gap</span>
                <span className="report-snapshot-value">{brief.thought_action_gap}</span>
                <span className="report-snapshot-sub">{brief.thought_action_gap_label}</span>
              </div>
              <div className="report-snapshot-metric">
                <span className="report-snapshot-label">Current Leadership Level</span>
                <span className="report-snapshot-value report-snapshot-value-accent">{brief.leadership_nexus_level}</span>
                <span className="report-snapshot-sub">&nbsp;</span>
              </div>
            </div>
            <div className="report-divider" />
          </div>

          {/* EVIDENCE: Leadership Profile + Weekly Trend */}
          <ReportLeadershipProfile
            required={brief.required_leadership_profile}
            actual={brief.actual_leadership_profile}
          />
          <ReportMonthlyTrend trend={brief.monthly_trend} />

          {/* COACHING PRIORITIES */}
          <ReportCoachingFocus
            whatsWorking={brief.whats_working}
            watchOutFor={brief.watch_out_for}
            primaryFocus={brief.primary_focus}
            primaryFocusExplanation={brief.primary_focus_explanation}
          />

          {/* DEVELOPMENT ACTIONS */}
          <ReportDevelopmentActions
            recommendation={brief.growth_recommendation}
            secondaryFocus={brief.secondary_focus}
          />
        </div>
      </div>
    </div>
  );
}