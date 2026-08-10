import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import ReportSelector from "@/components/report/ReportSelector";
import ReportBrief from "@/components/report/ReportBrief";

export default function MonthlyLeadershipReview() {
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  });
  const [brief, setBrief] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [gptModel, setGptModel] = useState("gpt_5_4");
  const [claudeModel, setClaudeModel] = useState("claude_sonnet_4_6");
  const [briefs, setBriefs] = useState(null);
  const [activeTab, setActiveTab] = useState("gpt");

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me) {
          window.location.href = "/SignIn";
          return;
        }
        const profiles = await base44.entities.Profiles.filter({ base44_user_id: me.id });
        const profile = Array.isArray(profiles) ? profiles[0] : null;
        const isAdmin =
          me.role === "admin" ||
          profile?.role === "admin" ||
          profile?.role === "coach_admin";
        const isCoach = profile?.role === "COACH";

        if (!isAdmin && !isCoach) {
          setError("You are not authorized to view this page.");
          setLoading(false);
          return;
        }

        // Fetch clients: admins see all, coaches see only theirs
        const clientList = isAdmin
          ? await base44.entities.Client.list("-created_date", 200)
          : await base44.entities.Client.filter({ coach_id: profile.id });

        // For each client, resolve their profile ID
        const clientsWithProfiles = [];
        for (const c of clientList) {
          if (!c.base44_user_id) continue;
          const pRows = await base44.entities.Profiles.filter({
            base44_user_id: c.base44_user_id,
          });
          const p = Array.isArray(pRows) ? pRows[0] : null;
          if (p?.id) {
            clientsWithProfiles.push({
              profile_id: p.id,
              name: c.full_name || p.display_name || p.full_name || c.email || "Unknown",
              company: c.company || "",
            });
          }
        }

        setClients(clientsWithProfiles);
        if (clientsWithProfiles.length > 0) {
          setSelectedClient(clientsWithProfiles[0].profile_id);
        }
      } catch (e) {
        setError(e?.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGenerate = async () => {
    if (!selectedClient || !month || generating) return;
    setGenerating(true);
    setError(null);
    setBrief(null);
    setBriefs(null);
    try {
      if (compareMode) {
        const [gptRes, claudeRes] = await Promise.all([
          base44.functions.invoke("generateMonthlyLeadershipReview", {
            client_profile_id: selectedClient,
            month,
            model: gptModel,
          }),
          base44.functions.invoke("generateMonthlyLeadershipReview", {
            client_profile_id: selectedClient,
            month,
            model: claudeModel,
          }),
        ]);
        setBriefs({ gpt: gptRes.data, claude: claudeRes.data });
      } else {
        const res = await base44.functions.invoke("generateMonthlyLeadershipReview", {
          client_profile_id: selectedClient,
          month,
        });
        setBrief(res.data);
      }
    } catch (e) {
      setError(
        e?.response?.data?.error || e?.message || "Failed to generate report."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleCompare = (checked) => {
    setCompareMode(checked);
    setBrief(null);
    setBriefs(null);
    setError(null);
  };

  const handleDownloadPDF = async () => {
    const activeBrief = compareMode ? briefs?.[activeTab] : brief;
    if (!reportRef.current || downloading || !activeBrief) return;
    setDownloading(true);
    try {
      reportRef.current.classList.add("report-capturing");
      await document.fonts.ready;
      await new Promise(requestAnimationFrame);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });
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

      const fileName = `${activeBrief.client_name.replace(/\s+/g, "_")}_Monthly_Leadership_Brief_${activeBrief.review_period.replace(/\s+/g, "_")}${compareMode ? `_${activeTab}` : ""}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      reportRef.current?.classList.remove("report-capturing");
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !clients.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-viewport">
      <ReportSelector
        clients={clients}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        month={month}
        setMonth={setMonth}
        onGenerate={handleGenerate}
        generating={generating}
        compareMode={compareMode}
        onToggleCompare={handleToggleCompare}
        gptModel={gptModel}
        setGptModel={setGptModel}
        claudeModel={claudeModel}
        setClaudeModel={setClaudeModel}
      />

      {error && (
        <div className="w-[8.5in] max-w-full mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {generating && (
        <div className="w-full text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f] mx-auto mb-4" />
          <p className="text-gray-500">{compareMode ? "Generating both briefs in parallel..." : "Generating leadership brief..."}</p>
        </div>
      )}

      {compareMode && briefs && !generating && (
        <>
          <div className="w-[8.5in] max-w-full mb-3 flex items-center gap-2">
            {["gpt", "claude"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition ${
                  activeTab === tab
                    ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {tab === "gpt" ? "ChatGPT" : "Claude"}
              </button>
            ))}
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              variant="default"
              size="sm"
              className="ml-auto"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {downloading
                ? "Generating PDF..."
                : `Download ${activeTab === "gpt" ? "ChatGPT" : "Claude"} PDF`}
            </Button>
          </div>
          {briefs[activeTab] && (
            <ReportBrief brief={briefs[activeTab]} innerRef={reportRef} />
          )}
        </>
      )}

      {!compareMode && brief && !generating && (
        <>
          <div className="report-pdf-toolbar">
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              variant="default"
              size="sm"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {downloading ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
          <ReportBrief brief={brief} innerRef={reportRef} />
        </>
      )}

      {!brief && !briefs && !generating && !error && (
        <div className="w-full text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Select a client and month{compareMode ? ", choose your models" : ""}, then click Generate to view the Monthly
            Leadership Brief.
          </p>
        </div>
      )}
    </div>
  );
}