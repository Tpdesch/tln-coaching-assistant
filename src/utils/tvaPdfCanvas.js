// PDF-only Thought vs. Action chart canvas.
// Fixed internal dimensions: 750 × 390 pixels.
// Not wired into the report — standalone module for PDF generation.

export const PDF_CHART_WIDTH = 750;
export const PDF_CHART_HEIGHT = 390;

/**
 * Creates a blank fixed-size canvas (750 × 390) for the PDF chart.
 * Returns the canvas element.
 */
export function createPdfChartCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_CHART_WIDTH;
  canvas.height = PDF_CHART_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PDF_CHART_WIDTH, PDF_CHART_HEIGHT);
  return canvas;
}

/**
 * Creates a blank fixed-size canvas and returns its PNG data URL.
 */
export function createPdfChartDataURL() {
  const canvas = createPdfChartCanvas();
  return canvas.toDataURL("image/png");
}