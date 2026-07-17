import React, { useState, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2, Play, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReportExecutiveSummary from "@/components/report/ReportExecutiveSummary";
import ReportPatternsThisMonth from "@/components/report/ReportPatternsThisMonth";
import ReportWhatsWorking from "@/components/report/ReportWhatsWorking";
import ReportWatchOutFor from "@/components/report/ReportWatchOutFor";
import ReportRecommendedFocus from "@/components/report/ReportRecommendedFocus";

export default function AdminMonthlyReviewTest({ allProfiles, allClients }) {
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);

  // Build participant options — clients with profile IDs
  const participants = useMemo(() => {
    const profileById = {};
    (allProfiles || []).forEach(p => { profileById[p.id] = p; });

    return (allClients || [])
      .filter(c => c.base44_user_id)
      .map(c => {
        const profile = (allProfiles || []).find(p => p.base44_user_id === c.base44_user_id);
        return profile ? { profileId: profile.id, name: profile.display_name || profile.full_name || c.full_name || c.email } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allProfiles, allClients]);

  const handleGenerate = async () => {
    if (!selectedProfileId || !selectedMonth) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await base44.functions.invoke("generateMonthlyLeadershipReview", {
        client_profile_id: selectedProfileId,
        month: selectedMonth,
      });
      setResult(res.data);
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || downloading) return;
    setDownloading(true);
    try {
      reportRef.current.classList.add("report-capturing");
      await new Promise((r) => setTimeout(r, 50));
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

      const fileName = `${(result.client_name || "Client").replace(/\s+/g, "_")}_Monthly_Leadership_Brief_${(result.review_period || "").replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      reportRef.current?.classList.remove("report-capturing");
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-amber-600" />
        <h2 className="text-base font-semibold text-gray-900">Generate Monthly Review Test</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Temporary test panel — generates a structured monthly leadership review. Nothing is saved or sent.
      </p>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Participant</label>
          <select
            value={selectedProfileId}
            onChange={e => { setSelectedProfileId(e.target.value); setResult(null); setError(null); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">— Select participant —</option>
            {participants.map(p => (
              <option key={p.profileId} value={p.profileId}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => { setSelectedMonth(e.target.value); setResult(null); setError(null); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={!selectedProfileId || !selectedMonth || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Generate
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Monthly Leadership Brief</h3>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-white text-xs font-semibold hover:bg-[#15294a] disabled:opacity-40 transition"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {downloading ? "Generating PDF..." : "Download PDF"}
            </button>
          </div>
          <div className="report-viewport" style={{ minHeight: "auto", padding: 0 }}>
            <div className="report-page" ref={reportRef}>
              <div className="report-grid">
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

                <div className="col-span-12">
                  <div className="report-divider" />
                  <div className="report-client-info">
                    <div className="report-client-info-col report-client-info-col-left">
                      <span className="report-client-info-heading">Client Information</span>
                      <div className="report-client-info-fields">
                        <span className="report-client-name">{result.client_name}</span>
                        <span className="report-client-detail">{result.client_title}</span>
                        <span className="report-client-detail">{result.client_company}</span>
                      </div>
                    </div>
                    <div className="report-client-info-col report-client-info-col-center">
                      <span className="report-client-info-heading">Coach</span>
                      <div className="report-client-info-fields">
                        <span className="report-client-detail">{result.coach_name}</span>
                      </div>
                    </div>
                    <div className="report-client-info-col report-client-info-col-right">
                      <span className="report-client-info-heading">Review Information</span>
                      <div className="report-client-info-fields">
                        <span className="report-client-detail">
                          <span className="report-client-detail-label report-client-detail-label-dark">Generated:</span>
                          <span>{result.generated_date}</span>
                        </span>
                        <span className="report-client-detail">
                          <span className="report-client-detail-label report-client-detail-label-dark">Period:</span>
                          <span>{result.review_period}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="report-divider" />
                </div>

                <ReportExecutiveSummary data={result.executive_summary} />

                <ReportPatternsThisMonth
                  leadershipPattern={result.leadership_pattern}
                  leadershipMomentum={result.leadership_momentum}
                  thoughtAverages={result.thought_averages}
                  actionAverages={result.action_averages}
                />

                <div className="col-span-12">
                  <div className="report-insights-grid">
                    <ReportWhatsWorking items={result.whats_working} />
                    <ReportWatchOutFor items={result.watch_out_for} />
                  </div>
                  <div className="report-divider" />
                </div>

                <ReportRecommendedFocus
                  primary={result.leadership_practices?.primary_practice}
                  supporting={result.leadership_practices?.supporting_practice}
                  growth={result.leadership_practices?.growth_practice}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}