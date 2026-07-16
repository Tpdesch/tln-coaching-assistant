// PDF-only Thought vs. Action chart canvas.
// Fixed internal dimensions: 750 × 390 pixels.
// Renders directly from chart data using fixed coordinates — no DOM capture.
// Not wired into the report — standalone module for PDF generation.

import { monthlyLeadershipBrief as brief } from "@/data/monthlyReviewMock";

export const PDF_CHART_WIDTH = 750;
export const PDF_CHART_HEIGHT = 390;

// Standardized series colors
const THOUGHT_COLOR = "#1e3a5f";
const ACTION_COLOR = "#27ae60";

// Official Leadership Nexus assessment level colors (L1–L5)
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];
const LEVELS = [1, 2, 3, 4, 5];

// Fixed layout constants
const PAD_LEFT = 30;
const PAD_RIGHT = 30;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

const LEGEND_Y = 24;
const LEGEND_SWATCH = 11;
const LEGEND_GAP = 7;
const LEGEND_ITEM_GAP = 28;

const LEVEL_LABEL_X = PAD_LEFT;
const LEVEL_LABEL_W = 40;

const BAR_START_X = LEVEL_LABEL_X + LEVEL_LABEL_W + 10;
const BAR_AREA_W = 480;

const VALUE_END_X = PDF_CHART_WIDTH - PAD_RIGHT;

const ROW_AREA_TOP = 48;
const ROW_AREA_BOTTOM = PDF_CHART_HEIGHT - PAD_BOTTOM;
const ROW_AREA_H = ROW_AREA_BOTTOM - ROW_AREA_TOP;
const ROW_H = ROW_AREA_H / LEVELS.length;

const BAR_HEIGHT = 5;
const BAR_GAP = 4;

const STROKE_COLOR = "rgba(0,0,0,0.35)";
const FONT = "bold 13px Arial, sans-serif";
const FONT_SMALL = "bold 12px Arial, sans-serif";

/**
 * Renders the Thought vs. Action chart onto a fixed 750 × 390 canvas.
 * Returns the canvas element.
 */
export function createPdfChartCanvas(thoughtAverages, actionAverages) {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_CHART_WIDTH;
  canvas.height = PDF_CHART_HEIGHT;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PDF_CHART_WIDTH, PDF_CHART_HEIGHT);

  ctx.textBaseline = "middle";

  // ---- Legend ----
  let lx = PAD_LEFT;
  ctx.font = FONT;

  // Thought swatch + label
  ctx.fillStyle = THOUGHT_COLOR;
  ctx.fillRect(lx, LEGEND_Y, LEGEND_SWATCH, LEGEND_SWATCH);
  ctx.fillStyle = "#1e3a5f";
  ctx.textAlign = "left";
  ctx.fillText("Thought", lx + LEGEND_SWATCH + LEGEND_GAP, LEGEND_Y + LEGEND_SWATCH / 2);
  lx += LEGEND_SWATCH + LEGEND_GAP + ctx.measureText("Thought").width + LEGEND_ITEM_GAP;

  // Action swatch + label
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = ACTION_COLOR;
  ctx.fillRect(lx, LEGEND_Y, LEGEND_SWATCH, LEGEND_SWATCH);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#1e3a5f";
  ctx.fillText("Action", lx + LEGEND_SWATCH + LEGEND_GAP, LEGEND_Y + LEGEND_SWATCH / 2);

  // ---- Rows (equal vertical spacing) ----
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const thought = thoughtAverages[`level_${lvl}`];
    const action = actionAverages[`level_${lvl}`];

    const rowTop = ROW_AREA_TOP + i * ROW_H;
    const rowCenter = rowTop + ROW_H / 2;

    // Level label with text outline for legibility
    ctx.font = FONT;
    ctx.textAlign = "left";
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = STROKE_COLOR;
    ctx.strokeText(`L${lvl}`, LEVEL_LABEL_X, rowCenter);
    ctx.fillStyle = LEVEL_COLORS[i];
    ctx.fillText(`L${lvl}`, LEVEL_LABEL_X, rowCenter);

    // Thought bar (solid navy)
    const thoughtW = (thought * 0.80 / 100) * BAR_AREA_W;
    const thoughtY = rowCenter - BAR_GAP / 2 - BAR_HEIGHT;
    ctx.fillStyle = THOUGHT_COLOR;
    ctx.fillRect(BAR_START_X, thoughtY, thoughtW, BAR_HEIGHT);

    // Action bar (faded green)
    const actionW = (action * 0.80 / 100) * BAR_AREA_W;
    const actionY = rowCenter + BAR_GAP / 2;
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = ACTION_COLOR;
    ctx.fillRect(BAR_START_X, actionY, actionW, BAR_HEIGHT);
    ctx.globalAlpha = 1;

    // Value pair: "T {val}" navy + " A {val}" green, right-aligned at VALUE_END_X
    ctx.font = FONT_SMALL;
    const thoughtText = `T ${thought}`;
    const actionText = ` A ${action}`;
    const tw = ctx.measureText(thoughtText).width;
    const aw = ctx.measureText(actionText).width;
    const totalW = tw + aw;
    const startX = VALUE_END_X - totalW;

    ctx.fillStyle = THOUGHT_COLOR;
    ctx.fillText(thoughtText, startX, rowCenter);
    ctx.fillStyle = ACTION_COLOR;
    ctx.fillText(actionText, startX + tw, rowCenter);
  }

  return canvas;
}

/**
 * Renders the chart and returns its PNG data URL.
 */
export function createPdfChartDataURL(thoughtAverages, actionAverages) {
  const canvas = createPdfChartCanvas(thoughtAverages, actionAverages);
  return canvas.toDataURL("image/png");
}