import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, GitCompare } from "lucide-react";

const GPT_MODELS = [
  { value: "gpt_5_mini", label: "GPT-5 mini" },
  { value: "gpt_5_4", label: "GPT-5.4" },
  { value: "gpt_5_6_sol", label: "GPT-5.6 Sol" },
  { value: "gpt_5_6_luna", label: "GPT-5.6 Luna" },
];

const CLAUDE_MODELS = [
  { value: "claude_sonnet_4_6", label: "Claude Sonnet 4.6" },
  { value: "claude_opus_4_6", label: "Claude Opus 4.6" },
];

const selectClass =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent";

export default function ReportSelector({
  clients,
  selectedClient,
  setSelectedClient,
  month,
  setMonth,
  onGenerate,
  generating,
  compareMode,
  onToggleCompare,
  gptModel,
  setGptModel,
  claudeModel,
  setClaudeModel,
}) {
  return (
    <div className="w-[8.5in] max-w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Client
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className={selectClass}
          >
            {clients.length === 0 && <option value="">No clients found</option>}
            {clients.map((c) => (
              <option key={c.profile_id} value={c.profile_id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Month
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={selectClass}
          />
        </div>
        <Button
          onClick={onGenerate}
          disabled={generating || !selectedClient || !month}
          size="default"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {generating ? "Generating..." : compareMode ? "Generate Both" : "Generate Brief"}
        </Button>
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(e) => onToggleCompare(e.target.checked)}
            className="w-4 h-4 accent-[#1e3a5f]"
          />
          <GitCompare className="w-4 h-4" />
          Compare models
        </label>
      </div>

      {compareMode && (
        <div className="flex flex-wrap items-end gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="min-w-[190px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              ChatGPT model
            </label>
            <select
              value={gptModel}
              onChange={(e) => setGptModel(e.target.value)}
              className={selectClass}
            >
              {GPT_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[190px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Claude model
            </label>
            <select
              value={claudeModel}
              onChange={(e) => setClaudeModel(e.target.value)}
              className={selectClass}
            >
              {CLAUDE_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-amber-600 self-center">
            Generates two briefs in parallel — uses 2× integration credits.
          </p>
        </div>
      )}
    </div>
  );
}