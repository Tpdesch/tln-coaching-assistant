import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CheckInResultCard from "./CheckInResultCard";

export default function CheckInCarousel({ items = [] }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <p className="text-gray-400 text-sm">No check-ins available</p>
      </div>
    );
  }

  const current = items[currentIdx];
  const hasMultiple = items.length > 1;

  return (
    <div className="space-y-4">
      {/* Carousel container */}
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          {hasMultiple && (
            <button
              onClick={() => setCurrentIdx(i => (i - 1 + items.length) % items.length)}
              className="p-2 hover:bg-gray-100 rounded-lg transition shrink-0"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <CheckInResultCard
              interaction={current.interaction}
              inferenceRun={current.inferenceRun}
              defaultExpanded={true}
            />
          </div>

          {hasMultiple && (
            <button
              onClick={() => setCurrentIdx(i => (i + 1) % items.length)}
              className="p-2 hover:bg-gray-100 rounded-lg transition shrink-0"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation dots */}
      {hasMultiple && (
        <div className="flex justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-2 h-2 rounded-full transition ${
                idx === currentIdx ? "bg-gray-800" : "bg-gray-300"
              }`}
              aria-label={`Go to check-in ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Status bar */}
      {hasMultiple && (
        <div className="text-center text-xs text-gray-500">
          {currentIdx + 1} of {items.length}
        </div>
      )}
    </div>
  );
}