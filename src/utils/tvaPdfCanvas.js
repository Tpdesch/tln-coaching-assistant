// PDF-only Thought vs. Action score-track chart canvas.
// Fixed internal dimensions: 750 × 390 pixels.
// Column headings (Thought / Action) + five level rows × two side-by-side tracks.
// Each track: light-gray background (max score) + colored fill (actual score).
// No legend, no numeric values, no axis, no tick marks.

export const PDF_CHART_WIDTH = 750;
export const PDF_CHART_HEIGHT = 390;

const THOUGHT_COLOR = "#1e3a5f";
const ACTION_COLOR = "#27ae60";
const TRACK_BG = "#f3f4f6";

// Official Leadership Nexus assessment level colors (L1–L5)
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];
const LEVELS = [1, 2, 3, 4, 5];

const PAD_LEFT = 30;
const PAD_RIGHT = 30;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

const LEVEL_LABEL_X = PAD_LEFT;
const LEVEL_LABEL_W = 44;

const TRACK_START_X = LEVEL_LABEL_X + LEVEL_LABEL_W + 12;
const TRACK_AREA_W = PDF_CHART_WIDTH - PAD_RIGHT - TRACK_START_X;
const TRACK_COL_GAP = 18;
const TRACK_W = (TRACK_AREA_W - TRACK_COL_GAP) / 2;

const THOUGHT_TRACK_X = TRACK_START_X;
const ACTION_TRACK_X = TRACK_START_X + TRACK_W + TRACK_COL_GAP;

const HEADING_Y = 30;
const ROW_AREA_TOP = 54;
const ROW_AREA_BOTTOM = PDF_CHART_HEIGHT - PAD_BOTTOM;
const ROW_AREA_H = ROW_AREA_BOTTOM - ROW_AREA_TOP;
const ROW_H = ROW_AREA_H / LEVELS.length;

const TRACK_HEIGHT = 9;

const STROKE_COLOR = "rgba(0,0,0,0.4)";
const HEADING_FONT = "bold 13px Arial, sans-serif";
const LEVEL_FONT = "bold 18px Arial, sans-serif";

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

  // ---- Column headings ----
  ctx.font = HEADING_FONT;
  ctx.textAlign = "left";
  ctx.fillStyle = "#1e3a5f";
  ctx.fillText("Thought", THOUGHT_TRACK_X, HEADING_Y);
  ctx.fillText("Action", ACTION_TRACK_X, HEADING_Y);

  // ---- Level rows ----
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const thought = thoughtAverages[`level_${lvl}`];
    const action = actionAverages[`level_${lvl}`];

    const rowTop = ROW_AREA_TOP + i * ROW_H;
    const rowCenter = rowTop + ROW_H / 2;

    // Level label
    ctx.font = LEVEL_FONT;
    ctx.textAlign = "left";
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = STROKE_COLOR;
    ctx.strokeText(`L${lvl}`, LEVEL_LABEL_X, rowCenter);
    ctx.fillStyle = LEVEL_COLORS[i];
    ctx.fillText(`L${lvl}`, LEVEL_LABEL_X, rowCenter);

    // Thought track: gray background + navy fill
    const thoughtW = (thought / 100) * TRACK_W;
    ctx.fillStyle = TRACK_BG;
    ctx.fillRect(THOUGHT_TRACK_X, rowCenter - TRACK_HEIGHT / 2, TRACK_W, TRACK_HEIGHT);
    ctx.fillStyle = THOUGHT_COLOR;
    ctx.fillRect(THOUGHT_TRACK_X, rowCenter - TRACK_HEIGHT / 2, thoughtW, TRACK_HEIGHT);

    // Action track: gray background + green fill
    const actionW = (action / 100) * TRACK_W;
    ctx.fillStyle = TRACK_BG;
    ctx.fillRect(ACTION_TRACK_X, rowCenter - TRACK_HEIGHT / 2, TRACK_W, TRACK_HEIGHT);
    ctx.fillStyle = ACTION_COLOR;
    ctx.fillRect(ACTION_TRACK_X, rowCenter - TRACK_HEIGHT / 2, actionW, TRACK_HEIGHT);
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