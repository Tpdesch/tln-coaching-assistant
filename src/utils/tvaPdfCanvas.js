// PDF-only Thought vs. Action chart canvas.
// Fixed internal dimensions: 750 × 390 pixels.
// Renders directly from chart data using fixed coordinates — no DOM capture.

export const PDF_CHART_WIDTH = 750;
export const PDF_CHART_HEIGHT = 390;

// Standardized series colors
const THOUGHT_COLOR = "#1e3a5f";   // Leadership Nexus navy
const ACTION_COLOR = "#27ae60";    // Leadership Nexus green
const ACTION_TEXT_COLOR = "#1a7d44"; // darker green for print legibility

// Official Leadership Nexus assessment level colors (L1–L5)
const LEVEL_COLORS = ["#C00000", "#E6A800", "#B8B800", "#008A3D", "#0080B0"];
const LEVELS = [1, 2, 3, 4, 5];

// Fixed layout constants
const PAD_LEFT = 30;
const PAD_RIGHT = 30;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

const LEGEND_Y = 22;
const LEGEND_SWATCH = 14;
const LEGEND_GAP = 8;
const LEGEND_ITEM_GAP = 32;

const LEVEL_LABEL_X = PAD_LEFT;
const LEVEL_LABEL_W = 44;

const BAR_START_X = LEVEL_LABEL_X + LEVEL_LABEL_W + 12;
const BAR_AREA_W = 470;

const VALUE_END_X = PDF_CHART_WIDTH - PAD_RIGHT;

const ROW_AREA_TOP = 52;
const ROW_AREA_BOTTOM = PDF_CHART_HEIGHT - PAD_BOTTOM;
const ROW_AREA_H = ROW_AREA_BOTTOM - ROW_AREA_TOP;
const ROW_H = ROW_AREA_H / LEVELS.length;

const BAR_HEIGHT = 7;
const BAR_GAP = 5;

const STROKE_COLOR = "rgba(0,0,0,0.4)";
const FONT = "bold 18px Arial, sans-serif";
const FONT_SMALL = "bold 16px Arial, sans-serif";

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

  // Action swatch + label (fully opaque)
  ctx.fillStyle = ACTION_COLOR;
  ctx.fillRect(lx, LEGEND_Y, LEGEND_SWATCH, LEGEND_SWATCH);
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
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = STROKE_COLOR;
    ctx.strokeText(`L${lvl}`, LEVEL_LABEL_X, rowCenter);
    ctx.fillStyle = LEVEL_COLORS[i];
    ctx.fillText(`L${lvl}`, LEVEL_LABEL_X, rowCenter);

    // Thought bar (solid navy, fully opaque)
    const thoughtW = (thought * 0.80 / 100) * BAR_AREA_W;
    const thoughtY = rowCenter - BAR_GAP / 2 - BAR_HEIGHT;
    ctx.fillStyle = THOUGHT_COLOR;
    ctx.fillRect(BAR_START_X, thoughtY, thoughtW, BAR_HEIGHT);

    // Action bar (solid green, fully opaque)
    const actionW = (action * 0.80 / 100) * BAR_AREA_W;
    const actionY = rowCenter + BAR_GAP / 2;
    ctx.fillStyle = ACTION_COLOR;
    ctx.fillRect(BAR_START_X, actionY, actionW, BAR_HEIGHT);

    // Value pair: "T {val}" navy + " A {val}" dark green, right-aligned at VALUE_END_X
    ctx.font = FONT_SMALL;
    const thoughtText = `T ${thought}`;
    const actionText = ` A ${action}`;
    const tw = ctx.measureText(thoughtText).width;
    const aw = ctx.measureText(actionText).width;
    const totalW = tw + aw;
    const startX = VALUE_END_X - totalW;

    ctx.fillStyle = THOUGHT_COLOR;
    ctx.fillText(thoughtText, startX, rowCenter);
    ctx.fillStyle = ACTION_TEXT_COLOR;
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