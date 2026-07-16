// Fixed-size canvas renderer for the Thought vs. Action chart (PDF-only).
// Draws directly onto a <canvas> using chart data — no DOM capture.

const THOUGHT_COLOR = "#1e3a5f";
const ACTION_COLOR = "#27ae60";
const LEVEL_COLORS = ["#C00000", "#FFC000", "#FFFF00", "#00B050", "#00B0F0"];
const LEVELS = [1, 2, 3, 4, 5];

const CANVAS_W = 750;
const CANVAS_H = 390;

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

const VALUE_END_X = CANVAS_W - PAD_RIGHT;

const ROW_AREA_TOP = 48;
const ROW_AREA_BOTTOM = CANVAS_H - PAD_BOTTOM;
const ROW_AREA_H = ROW_AREA_BOTTOM - ROW_AREA_TOP;
const ROW_H = ROW_AREA_H / LEVELS.length;

const BAR_HEIGHT = 5;
const BAR_GAP = 4;

const STROKE_COLOR = "rgba(0,0,0,0.35)";

export function renderTvaChartDataURL(thoughtAverages, actionAverages) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textBaseline = "middle";

  // ---- Legend ----
  let lx = PAD_LEFT;
  ctx.font = "bold 13px Arial, sans-serif";

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

  // ---- Rows ----
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const thought = thoughtAverages[`level_${lvl}`];
    const action = actionAverages[`level_${lvl}`];

    const rowTop = ROW_AREA_TOP + i * ROW_H;
    const rowCenter = rowTop + ROW_H / 2;

    // Level label with text outline for legibility
    ctx.font = "bold 13px Arial, sans-serif";
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

    // Value pair: "T {val}" navy + " A {val}" green, right-aligned
    ctx.font = "bold 12px Arial, sans-serif";
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

  return canvas.toDataURL("image/png");
}