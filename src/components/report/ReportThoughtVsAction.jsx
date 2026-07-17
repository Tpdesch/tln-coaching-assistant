import React, { useRef, useLayoutEffect } from "react";

const LEVELS = [1, 2, 3, 4, 5];

const THOUGHT_COLOR = "#1e3a5f"; // Leadership Nexus navy
const ACTION_COLOR = "#27ae60";  // Leadership Nexus green
const TRACK_COLOR = "#d1d5db";

// Official Leadership Nexus assessment level colors (L1–L5)
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];

const normalizeLikertToPercent = (score) => {
  const numericScore = Number(score) || 0;
  return Math.max(0, Math.min(100, (numericScore / 5) * 100));
};

// Fixed canvas layout coordinates (CSS display units)
const DISPLAY_WIDTH = 250;
const DISPLAY_HEIGHT = 145;
const PIXEL_RATIO = 2;

const LEVEL_LABEL_X = 4;
const LEVEL_LABEL_WIDTH = 18;
const TEXT_LABEL_X = 24;
const TEXT_LABEL_WIDTH = 42;
const TRACK_X = 70;
const TRACK_WIDTH = DISPLAY_WIDTH - TRACK_X - 5; // ends ~5px from right edge
const BAR_HEIGHT = 5;
const TOP_PAD = 7;
const BOTTOM_PAD = 4;
const ROW_COUNT = LEVELS.length * 2; // Thought + Action per level
const ROW_HEIGHT = (DISPLAY_HEIGHT - TOP_PAD - BOTTOM_PAD) / ROW_COUNT;

export default function ReportThoughtVsAction({ thoughtAverages, actionAverages }) {
  const canvasRef = useRef(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = DISPLAY_WIDTH * PIXEL_RATIO;
    canvas.height = DISPLAY_HEIGHT * PIXEL_RATIO;
    canvas.style.width = `${DISPLAY_WIDTH}px`;
    canvas.style.height = `${DISPLAY_HEIGHT}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    ctx.clearRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    LEVELS.forEach((lvl, levelIdx) => {
      const levelColor = LEVEL_COLORS[levelIdx];

      // Level label spans both rows — midpoint of the level's two rows
      const thoughtRowMid = TOP_PAD + (levelIdx * 2) * ROW_HEIGHT + ROW_HEIGHT / 2;
      const actionRowMid = TOP_PAD + (levelIdx * 2 + 1) * ROW_HEIGHT + ROW_HEIGHT / 2;
      const levelMid = (thoughtRowMid + actionRowMid) / 2;

      // --- Level label (L1–L5) ---
      ctx.save();
      ctx.fillStyle = levelColor;
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 0.6;
      ctx.font = "700 8px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`L${lvl}`, LEVEL_LABEL_X, levelMid);
      ctx.restore();

      // --- Thought row ---
      const thoughtScore = thoughtAverages[`level_${lvl}`];
      const thoughtPct = normalizeLikertToPercent(thoughtScore);

      ctx.fillStyle = "#374151";
      ctx.font = "400 7px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Thought", TEXT_LABEL_X, thoughtRowMid);

      // Thought gray track
      ctx.fillStyle = TRACK_COLOR;
      ctx.fillRect(TRACK_X, thoughtRowMid - BAR_HEIGHT / 2, TRACK_WIDTH, BAR_HEIGHT);

      // Thought navy fill
      ctx.fillStyle = THOUGHT_COLOR;
      ctx.fillRect(TRACK_X, thoughtRowMid - BAR_HEIGHT / 2, (TRACK_WIDTH * thoughtPct) / 100, BAR_HEIGHT);

      // --- Action row ---
      const actionScore = actionAverages[`level_${lvl}`];
      const actionPct = normalizeLikertToPercent(actionScore);

      ctx.fillStyle = "#374151";
      ctx.font = "400 7px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Action", TEXT_LABEL_X, actionRowMid);

      // Action gray track
      ctx.fillStyle = TRACK_COLOR;
      ctx.fillRect(TRACK_X, actionRowMid - BAR_HEIGHT / 2, TRACK_WIDTH, BAR_HEIGHT);

      // Action green fill
      ctx.fillStyle = ACTION_COLOR;
      ctx.fillRect(TRACK_X, actionRowMid - BAR_HEIGHT / 2, (TRACK_WIDTH * actionPct) / 100, BAR_HEIGHT);
    });
  }, [thoughtAverages, actionAverages]);

  return (
    <div className="report-diagnostic-col">
      <span className="report-diagnostic-col-label report-tva-title">Thought vs. Action</span>
      <div className="report-tva-chart">
        <canvas ref={canvasRef} className="report-tva-canvas" />
      </div>
    </div>
  );
}