// Renders arbitrary text into an on/off stitch grid by rasterizing it with
// the browser's real font engine (canvas fillText) and sampling alpha per
// cell. This avoids hand-encoding a bitmap font and supports any text,
// including punctuation the source font supports.

function rasterizeText(text, cols, rows, opts = {}) {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
  if (!text || !text.trim()) return grid;

  const {
    fontFamily = 'Georgia, serif',
    fontWeight = 'normal',
    fontStyle = 'normal',
    threshold = 0.4,
  } = opts;

  const SAMPLE = 8; // internal supersampling per stitch cell
  const w = cols * SAMPLE;
  const h = rows * SAMPLE;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  let chosen = 10;
  for (let fs = h; fs >= 8; fs -= 2) {
    ctx.font = `${fontStyle} ${fontWeight} ${fs}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    if (metrics.width <= w * 0.94 && fs <= h * 0.92) {
      chosen = fs;
      break;
    }
  }
  ctx.font = `${fontStyle} ${fontWeight} ${chosen}px ${fontFamily}`;
  ctx.fillText(text, w / 2, h / 2 + chosen * 0.03);

  const imgData = ctx.getImageData(0, 0, w, h).data;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let sum = 0;
      let count = 0;
      for (let sy = 0; sy < SAMPLE; sy++) {
        for (let sx = 0; sx < SAMPLE; sx++) {
          const px = col * SAMPLE + sx;
          const py = row * SAMPLE + sy;
          const idx = (py * w + px) * 4;
          sum += imgData[idx + 3];
          count++;
        }
      }
      const avg = sum / count / 255;
      grid[row][col] = avg > threshold ? 1 : 0;
    }
  }
  return grid;
}

window.rasterizeText = rasterizeText;
