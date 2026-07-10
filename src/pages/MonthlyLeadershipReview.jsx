import React, { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { monthlyLeadershipBrief as brief } from "@/data/monthlyReviewMock";
import ReportExecutiveBrief from "@/components/report/ReportExecutiveBrief";
import ReportLeadershipDiagnostic from "@/components/report/ReportLeadershipDiagnostic";
import ReportMonthlyTrend from "@/components/report/ReportMonthlyTrend";
import ReportCoachingInsights from "@/components/report/ReportCoachingInsights";
import ReportLeadershipPractices from "@/components/report/ReportLeadershipPractices";

export default function MonthlyLeadershipReview() {
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!reportRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${brief.client_name.replace(/\s+/g, "_")}_Monthly_Leadership_Brief_${brief.review_period.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="report-viewport">
      <div className="report-pdf-toolbar">
        <Button onClick={handleDownloadPDF} disabled={downloading} variant="default" size="sm">
          {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {downloading ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>
      <div className="report-page" ref={reportRef}>
        <div className="report-grid">
          {/* CONTEXT: Three-column header */}
          <div className="col-span-12">
            <div className="report-header">
              <div className="report-header-left">
                <img
                  src="https://media.base44.com/images/public/69f3a039374ef274bec2c0fa/7f76d1077_generated_image.png"
                  alt="Leadership Nexus"
                  className="report-logo"
                />
              </div>
              <div className="report-header-center">
                <h1 className="report-title">Monthly Leadership Brief</h1>
              </div>
              <div className="report-header-right">
                <img
                  src="https://media.base44.com/images/public/69f3a039374ef274bec2c0fa/34d41ac3a_generated_image.png"
                  alt="Jamesson Solutions"
                  className="report-logo"
                />
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

          {/* CONTEXT → INSIGHT: Executive Brief */}
          <ReportExecutiveBrief data={brief.executive_brief} />

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

          {/* COACHING INSIGHTS */}
          <ReportCoachingInsights
            strengthsToBuildOn={brief.coaching_insights.strengths_to_build_on}
            emergingRisks={brief.coaching_insights.emerging_risks}
          />

          {/* LEADERSHIP PRACTICES */}
          <ReportLeadershipPractices
            primary={brief.leadership_practices.primary_practice}
            supporting={brief.leadership_practices.supporting_practice}
            growth={brief.leadership_practices.growth_practice}
          />
        </div>
      </div>
    </div>
  );
}