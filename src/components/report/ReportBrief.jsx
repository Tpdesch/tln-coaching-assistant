import React from "react";
import ReportExecutiveSummary from "@/components/report/ReportExecutiveSummary";
import ReportPatternsThisMonth from "@/components/report/ReportPatternsThisMonth";
import ReportWhatsWorking from "@/components/report/ReportWhatsWorking";
import ReportWatchOutFor from "@/components/report/ReportWatchOutFor";
import ReportRecommendedFocus from "@/components/report/ReportRecommendedFocus";

export default function ReportBrief({ brief, innerRef }) {
  return (
    <div className="report-page" ref={innerRef}>
      <div className="report-grid">
        {/* Three-column header */}
        <div className="col-span-12">
          <div className="report-header">
            <div className="report-header-left">
              <img
                src="https://media.base44.com/images/public/69f3a039374ef274bec2c0fa/8584c9c6a_LeadershipNexusLogoResized.jpg"
                alt="The Leadership Nexus"
                className="report-logo"
              />
            </div>
            <div className="report-header-center">
              <h1 className="report-title">Monthly Leadership Brief</h1>
            </div>
            <div className="report-header-right">
              <img
                src="https://media.base44.com/images/public/69f3a039374ef274bec2c0fa/f853dc255_JSLogo.png"
                alt="Jamesson Solutions"
                className="report-logo report-logo-js"
              />
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="col-span-12">
          <div className="report-divider" />
          <div className="report-client-info">
            <div className="report-client-info-col report-client-info-col-left">
              <span className="report-client-info-heading">
                Client Information
              </span>
              <div className="report-client-info-fields">
                <span className="report-client-name">
                  {brief.client_name}
                </span>
                <span className="report-client-detail">
                  {brief.client_title}
                </span>
                <span className="report-client-detail">
                  {brief.client_company}
                </span>
              </div>
            </div>

            <div className="report-client-info-col report-client-info-col-center">
              <span className="report-client-info-heading">Coach</span>
              <div className="report-client-info-fields">
                <span className="report-client-detail">
                  {brief.coach_name}
                </span>
              </div>
            </div>

            <div className="report-client-info-col report-client-info-col-right">
              <span className="report-client-info-heading">
                Review Information
              </span>
              <div className="report-client-info-fields">
                <span className="report-client-detail">
                  <span className="report-client-detail-label report-client-detail-label-dark">
                    Generated:
                  </span>
                  <span>{brief.generated_date}</span>
                </span>
                <span className="report-client-detail">
                  <span className="report-client-detail-label report-client-detail-label-dark">
                    Period:
                  </span>
                  <span>{brief.review_period}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="report-divider" />
        </div>

        {/* 1. Executive Summary */}
        <ReportExecutiveSummary data={brief.executive_summary} />

        {/* 2. Patterns This Month */}
        <ReportPatternsThisMonth
          leadershipPattern={brief.leadership_pattern}
          leadershipMomentum={brief.leadership_momentum}
          thoughtAverages={brief.thought_averages}
          actionAverages={brief.action_averages}
        />

        {/* 3. What's Working & Watch Out For */}
        <div className="col-span-12">
          <div className="report-insights-grid">
            <ReportWhatsWorking items={brief.whats_working} />
            <ReportWatchOutFor items={brief.watch_out_for} />
          </div>
          <div className="report-divider" />
        </div>

        {/* 4. Recommended Focus */}
        <ReportRecommendedFocus
          primary={brief.leadership_practices.primary_practice}
          supporting={brief.leadership_practices.supporting_practice}
          growth={brief.leadership_practices.growth_practice}
        />
      </div>
    </div>
  );
}