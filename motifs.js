// Parametric motif generators.
// Each returns a 2D array (rows x cols) of 0/1, computed from shape math
// instead of hand-drawn bitmaps, so shapes stay symmetric and correct
// at any requested size.

function makeGrid(w, h) {
  return Array.from({ length: h }, () => new Array(w).fill(0));
}

// Classic heart curve: (x^2 + y^2 - 1)^3 - x^2*y^3 <= 0
function generateHeart(w, h) {
  const grid = makeGrid(w, h);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      // normalize to [-1.2, 1.2] x [-1.3, 1.1], flip y (row 0 = top)
      const x = ((col + 0.5) / w) * 2.4 - 1.2;
      const yTop = 1.15 - ((row + 0.5) / h) * 2.35;
      const val = Math.pow(x * x + yTop * yTop - 1, 3) - x * x * Math.pow(yTop, 3);
      if (val <= 0) grid[row][col] = 1;
    }
  }
  return grid;
}

// Ring / annulus
function generateRing(w, h, thicknessRatio = 0.18) {
  const grid = makeGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rOuter = Math.min(w, h) / 2;
  const rInner = rOuter * (1 - thicknessRatio * 2);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const dx = (col - cx) / (w / h >= 1 ? w / h : 1);
      const dy = row - cy;
      const d = Math.sqrt(Math.pow(col - cx, 2) * Math.pow(h / w, 2) + Math.pow(row - cy, 2));
      if (d <= rOuter && d >= rInner) grid[row][col] = 1;
    }
  }
  return grid;
}

// Two interlocking rings (wedding rings motif)
function generateDoubleRing(w, h) {
  const grid = makeGrid(w, h);
  const rOuter = h / 2;
  const rInner = rOuter * 0.62;
  const cy = h / 2;
  const cx1 = w * 0.38;
  const cx2 = w * 0.62;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const d1 = Math.hypot(col - cx1, row - cy);
      const d2 = Math.hypot(col - cx2, row - cy);
      const on1 = d1 <= rOuter && d1 >= rInner;
      const on2 = d2 <= rOuter && d2 >= rInner;
      if (on1 || on2) grid[row][col] = 1;
    }
  }
  return grid;
}

// 5-petal flower: center circle + petals as offset circles
function generateFlower(w, h) {
  const grid = makeGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const petalR = Math.min(w, h) * 0.24;
  const orbit = Math.min(w, h) * 0.27;
  const petals = 5;
  const centers = [];
  for (let i = 0; i < petals; i++) {
    const angle = (Math.PI * 2 * i) / petals - Math.PI / 2;
    centers.push([cx + Math.cos(angle) * orbit, cy + Math.sin(angle) * orbit * (h / w >= 1 ? 1 : h / w)]);
  }
  const centerR = Math.min(w, h) * 0.16;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      let on = Math.hypot(col - cx, row - cy) <= centerR;
      if (!on) {
        for (const [pcx, pcy] of centers) {
          if (Math.hypot(col - pcx, row - pcy) <= petalR) {
            on = true;
            break;
          }
        }
      }
      if (on) grid[row][col] = 1;
    }
  }
  return grid;
}

// 5-pointed star via polygon point-in-polygon test
function generateStar(w, h) {
  const grid = makeGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rOuter = Math.min(w, h) / 2;
  const rInner = rOuter * 0.42;
  const points = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      if (pointInPolygon(col + 0.5, row + 0.5, points)) grid[row][col] = 1;
    }
  }
  return grid;
}

// small diamond, used as the repeating border unit
function generateDiamond(w, h) {
  const grid = makeGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const dx = Math.abs(col - cx) / (w / 2);
      const dy = Math.abs(row - cy) / (h / 2);
      if (dx + dy <= 1) grid[row][col] = 1;
    }
  }
  return grid;
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Stamp a small motif grid onto a larger grid at (row0, col0) with a given color index.
function stamp(target, motifGrid, row0, col0, colorIndex) {
  for (let r = 0; r < motifGrid.length; r++) {
    for (let c = 0; c < motifGrid[0].length; c++) {
      if (!motifGrid[r][c]) continue;
      const tr = row0 + r;
      const tc = col0 + c;
      if (tr < 0 || tc < 0 || tr >= target.length || tc >= target[0].length) continue;
      target[tr][tc] = colorIndex;
    }
  }
}

// Repeating diamond border around the perimeter, inset by `margin` stitches.
function drawBorder(target, margin, spacing, colorIndex) {
  const rows = target.length;
  const cols = target[0].length;
  const diamond = generateDiamond(5, 5);
  const top = margin;
  const bottom = rows - 1 - margin;
  const left = margin;
  const right = cols - 1 - margin;

  for (let col = left; col <= right; col += spacing) {
    stamp(target, diamond, top - 2, col - 2, colorIndex);
    stamp(target, diamond, bottom - 2, col - 2, colorIndex);
  }
  for (let row = top; row <= bottom; row += spacing) {
    stamp(target, diamond, row - 2, left - 2, colorIndex);
    stamp(target, diamond, row - 2, right - 2, colorIndex);
  }
  // simple straight double-line frame just inside the diamonds
  for (let col = left; col <= right; col++) {
    target[top][col] = target[top][col] || colorIndex;
    target[bottom][col] = target[bottom][col] || colorIndex;
  }
  for (let row = top; row <= bottom; row++) {
    target[row][left] = target[row][left] || colorIndex;
    target[row][right] = target[row][right] || colorIndex;
  }
}

window.Motifs = {
  makeGrid,
  generateHeart,
  generateRing,
  generateDoubleRing,
  generateFlower,
  generateStar,
  generateDiamond,
  stamp,
  drawBorder,
};
