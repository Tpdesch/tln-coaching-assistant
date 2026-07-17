import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

export default function ReportSelector({
  clients,
  selectedClient,
  setSelectedClient,
  month,
  setMonth,
  onGenerate,
  generating,
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
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
          {generating ? "Generating..." : "Generate Brief"}
        </Button>
      </div>
    </div>
  );
}