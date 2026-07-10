import React from "react";
import { monthlyLeadershipBrief as brief } from "@/data/monthlyReviewMock";
import ReportExecutiveSummary from "@/components/report/ReportExecutiveSummary";
import ReportLeadershipDiagnostic from "@/components/report/ReportLeadershipDiagnostic";
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

          {/* INSIGHT: Leadership Diagnostic */}
          <ReportLeadershipDiagnostic
            leadershipPattern={brief.leadership_pattern}
            required={brief.required_leadership_profile}
            actual={brief.actual_leadership_profile}
            leadershipMomentum={brief.leadership_momentum}
            primaryDevelopmentPattern={brief.primary_development_pattern}
          />

          {/* EVIDENCE: Weekly Trend */}
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