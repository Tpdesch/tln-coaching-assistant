import React from "react";
import { monthlyReview } from "@/data/monthlyReviewMock";

export default function MonthlyLeadershipReview() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Leadership Review</h1>
        <p className="text-sm text-gray-500 mt-1">
          Raw data preview — confirming structure before building the visual report.
        </p>
      </div>

      <pre className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap break-words">
{JSON.stringify(monthlyReview, null, 2)}
      </pre>
    </div>
  );
}