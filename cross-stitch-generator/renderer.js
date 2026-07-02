// Draws a stitch grid onto a canvas as a chart: colored cell fills,
// light gridlines every cell, bold gridlines every 10 cells (standard
// cross-stitch chart convention), and an optional diagonal watermark.

function renderGridToCanvas(canvas, grid, template, opts = {}) {
  const { cellPx = 8, watermark = false } = opts;
  const rows = grid.length;
  const cols = grid[0].length;

  canvas.width = cols * cellPx;
  canvas.height = rows * cellPx;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = grid[r][c];
      if (idx) {
        ctx.fillStyle = template.palette[idx] || '#000000';
        ctx.fillRect(c * cellPx, r * cellPx, cellPx, cellPx);
      }
    }
  }

  // light gridlines
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cellPx, 0);
    ctx.lineTo(c * cellPx, rows * cellPx);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cellPx);
    ctx.lineTo(cols * cellPx, r * cellPx);
    ctx.stroke();
  }

  // bold gridlines every 10 stitches
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  for (let c = 0; c <= cols; c += 10) {
    ctx.beginPath();
    ctx.moveTo(c * cellPx, 0);
    ctx.lineTo(c * cellPx, rows * cellPx);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r += 10) {
    ctx.beginPath();
    ctx.moveTo(0, r * cellPx);
    ctx.lineTo(cols * cellPx, r * cellPx);
    ctx.stroke();
  }

  if (watermark) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-30 * Math.PI) / 180);
    ctx.fillStyle = 'rgba(180, 30, 30, 0.28)';
    ctx.font = `bold ${Math.max(18, cellPx * 3)}px Arial`;
    ctx.textAlign = 'center';
    const spacing = Math.max(120, cellPx * 14);
    for (let y = -canvas.height; y < canvas.height; y += spacing) {
      ctx.fillText('PREVIEW — BUY TO UNLOCK', 0, y);
    }
    ctx.restore();
  }

  return canvas;
}

window.renderGridToCanvas = renderGridToCanvas;
