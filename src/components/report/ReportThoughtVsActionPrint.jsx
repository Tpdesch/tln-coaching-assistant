import React from "react";

const LEVELS = [1, 2, 3, 4, 5];

const THOUGHT_COLOR = "#1e3a5f";
const ACTION_COLOR = "#27ae60";
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];

// Fixed dimensions — all coordinates in SVG user units
const VIEW_W = 320;
const VIEW_H = 170;

// Column boundaries (fixed x positions)
const LABEL_X = 14;          // center of L1-L5 label column
const LABEL_W = 28;
const BAR_X = 40;            // fixed start x for every bar track
const BAR_MAX_W = 180;       // fixed maximum bar track width
const VALUE_X = 300;         // fixed right edge for value text (text-anchor=end)
const VALUE_RIGHT_MARGIN = 10;
const VALUE_TEXT_X = VIEW_W - VALUE_RIGHT_MARGIN; // 310

const ROW_H = 24;            // vertical space per level row
const ROW_START_Y = 50;      // first row baseline
const BAR_H = 3;             // height of each bar
const BAR_GAP = 2;           // gap between thought bar and action bar within a row

const LEGEND_Y = 26;
const LEGEND_SWATCH = 8;
const LEGEND_BAR_X = BAR_X;  // align legend with bar column

export default function ReportThoughtVsActionPrint({ thoughtAverages, actionAverages }) {
  return (
    <svg
      className="report-tva-print-svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      style={{ display: "none" }}
      aria-hidden="true"
    >
      {/* Section label */}
      <text x={0} y={12} className="report-tva-svg-label">Thought vs. Action</text>

      {/* Legend — aligned with bar column */}
      <g>
        <rect x={LEGEND_BAR_X} y={LEGEND_Y - 7} width={LEGEND_SWATCH} height={LEGEND_SWATCH} rx={1} fill={THOUGHT_COLOR} />
        <text x={LEGEND_BAR_X + LEGEND_SWATCH + 4} y={LEGEND_Y} className="report-tva-svg-legend-text">Thought</text>
        <rect x={LEGEND_BAR_X + 56} y={LEGEND_Y - 7} width={LEGEND_SWATCH} height={LEGEND_SWATCH} rx={1} fill={ACTION_COLOR} opacity="0.4" />
        <text x={LEGEND_BAR_X + 56 + LEGEND_SWATCH + 4} y={LEGEND_Y} className="report-tva-svg-legend-text">Action</text>
      </g>

      {/* L1–L5 rows */}
      {LEVELS.map((lvl, idx) => {
        const thought = thoughtAverages[`level_${lvl}`];
        const action = actionAverages[`level_${lvl}`];

        const rowY = ROW_START_Y + idx * ROW_H;
        const thoughtBarW = Math.min(BAR_MAX_W, (thought / 100) * BAR_MAX_W);
        const actionBarW = Math.min(BAR_MAX_W, (action / 100) * BAR_MAX_W);

        // Two bars stacked: thought on top, action below
        const thoughtBarY = rowY - BAR_H - 1;
        const actionBarY = rowY + 1;

        const valueText = `T ${thought} A ${action}`;

        return (
          <g key={lvl}>
            {/* Level label — fixed column */}
            <text
              x={LABEL_X}
              y={rowY}
              textAnchor="middle"
              className="report-tva-svg-level"
              fill={LEVEL_COLORS[idx]}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="0.5"
              paintOrder="stroke"
            >
              L{lvl}
            </text>

            {/* Thought bar */}
            <rect x={BAR_X} y={thoughtBarY} width={thoughtBarW} height={BAR_H} rx="1.5" fill={THOUGHT_COLOR} />
            {/* Action bar */}
            <rect x={BAR_X} y={actionBarY} width={actionBarW} height={BAR_H} rx="1.5" fill={ACTION_COLOR} opacity="0.4" />

            {/* Value pair — fixed right edge */}
            <text x={VALUE_TEXT_X} y={rowY} textAnchor="end" className="report-tva-svg-value">
              <tspan fill={THOUGHT_COLOR} fontWeight="700">T {thought}</tspan>
              <tspan fill={ACTION_COLOR} fontWeight="700"> A {action}</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}