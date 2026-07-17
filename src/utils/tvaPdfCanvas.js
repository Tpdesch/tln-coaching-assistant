// PDF-only Thought vs. Action score-track chart canvas.
// Fixed internal dimensions: 750 × 390 pixels.
// Five levels × two horizontal tracks (Thought, Action).
// Each track: light-gray background (max score) + colored fill (actual score).
// No legend, no numeric values.

export const PDF_CHART_WIDTH = 750;
export const PDF_CHART_HEIGHT = 390;

const THOUGHT_COLOR = "#1e3a5f";
const ACTION_COLOR = "#27ae60";
const TRACK_BG = "#f3f4f6";

const LEVEL_COLORS = ["#C00000", "#E6A800", "#B8B800", "#008A3D", "#0080B0"];
const LEVELS = [1, 2, 3, 4, 5];

const PAD_LEFT = 30;
const PAD_RIGHT = 30;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

const LEVEL_LABEL_X = PAD_LEFT;
const LEVEL_LABEL_W = 44;

const TRACK_START_X = LEVEL_LABEL_X + LEVEL_LABEL_W + 12;
const TRACK_AREA_W = PDF_CHART_WIDTH - PAD_RIGHT - TRACK_START_X;

const ROW_AREA_TOP = 40;
const ROW_AREA_BOTTOM = PDF_CHART_HEIGHT - PAD_BOTTOM;
const ROW_AREA_H = ROW_AREA_BOTTOM - ROW_AREA_TOP;
const ROW_H = ROW_AREA_H / LEVELS.length;

const TRACK_HEIGHT = 8;
const TRACK_GAP = 4;

const STROKE_COLOR = "rgba(0,0,0,0.4)";
const FONT = "bold 18px Arial, sans-serif";

/**
 * Renders the Thought vs. Action score-track chart onto a fixed 750 × 390 canvas.
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

  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const thought = thoughtAverages[`level_${lvl}`];
    const action = actionAverages[`level_${lvl}`];

    const rowTop = ROW_AREA_TOP + i * ROW_H;
    const rowCenter = rowTop + ROW_H / 2;

    // Level label
    ctx.font = FONT;
    ctx.textAlign = "left";
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = STROKE_COLOR;
    ctx.strokeText(`L${lvl}`, LEVEL_LABEL_X, rowCenter);
    ctx.fillStyle = LEVEL_COLORS[i];
    ctx.fillText(`L${lvl}`, LEVEL_LABEL_X, rowCenter);

    // Thought track: gray background + navy fill
    const thoughtW = (thought / 100) * TRACK_AREA_W;
    const thoughtY = rowCenter - TRACK_GAP / 2 - TRACK_HEIGHT;
    ctx.fillStyle = TRACK_BG;
    ctx.fillRect(TRACK_START_X, thoughtY, TRACK_AREA_W, TRACK_HEIGHT);
    ctx.fillStyle = THOUGHT_COLOR;
    ctx.fillRect(TRACK_START_X, thoughtY, thoughtW, TRACK_HEIGHT);

    // Action track: gray background + green fill
    const actionW = (action / 100) * TRACK_AREA_W;
    const actionY = rowCenter + TRACK_GAP / 2;
    ctx.fillStyle = TRACK_BG;
    ctx.fillRect(TRACK_START_X, actionY, TRACK_AREA_W, TRACK_HEIGHT);
    ctx.fillStyle = ACTION_COLOR;
    ctx.fillRect(TRACK_START_X, actionY, actionW, TRACK_HEIGHT);
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