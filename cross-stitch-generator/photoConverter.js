// Photo -> stitch pattern pipeline. The "confetti" problem (scattered
// single-stitch noise) comes from naively mapping every pixel to its
// nearest thread color independently. This pipeline avoids that with three
// steps instead of one:
//   1. Progressive canvas downsampling (proper box-filtered averaging,
//      not a single huge scale jump) so noise is smoothed before anything
//      is quantized.
//   2. K-means clustering to a small, fixed color count — colors are
//      chosen from the photo's actual clusters, not matched pixel-by-pixel
//      against the full DMC catalog.
//   3. A connected-component cleanup pass that folds any leftover speckle
//      (regions smaller than a minimum stitch count) into whichever
//      neighboring color surrounds it most.

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function coverFit(srcW, srcH, targetCols, targetRows) {
  const targetAspect = targetCols / targetRows;
  const srcAspect = srcW / srcH;
  let sw, sh, sx, sy;
  if (srcAspect > targetAspect) {
    sh = srcH;
    sw = srcH * targetAspect;
    sx = (srcW - sw) / 2;
    sy = 0;
  } else {
    sw = srcW;
    sh = srcW / targetAspect;
    sx = 0;
    sy = (srcH - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

function progressiveDownsample(img, targetW, targetH) {
  let curCanvas = document.createElement('canvas');
  curCanvas.width = img.naturalWidth || img.width;
  curCanvas.height = img.naturalHeight || img.height;
  let ctx = curCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  let curW = curCanvas.width;
  let curH = curCanvas.height;
  while (curW > targetW * 2 || curH > targetH * 2) {
    const nextW = Math.max(targetW, Math.floor(curW / 2));
    const nextH = Math.max(targetH, Math.floor(curH / 2));
    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = nextW;
    nextCanvas.height = nextH;
    const nctx = nextCanvas.getContext('2d');
    nctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingQuality = 'high';
    nctx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH);
    curCanvas = nextCanvas;
    curW = nextW;
    curH = nextH;
  }
  return { canvas: curCanvas, w: curW, h: curH };
}

function downsampleImageToGrid(img, cols, rows) {
  const { canvas: pre, w: preW, h: preH } = progressiveDownsample(img, cols, rows);
  const { sx, sy, sw, sh } = coverFit(preW, preH, cols, rows);

  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(pre, sx, sy, sw, sh, 0, 0, cols, rows);

  const data = ctx.getImageData(0, 0, cols, rows).data;
  const grid = [];
  for (let row = 0; row < rows; row++) {
    const gridRow = [];
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) * 4;
      gridRow.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
    grid.push(gridRow);
  }
  return grid;
}

function rgbDist(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function kMeansQuantize(flatPixels, k, iterations = 8) {
  const n = flatPixels.length;
  k = Math.max(1, Math.min(k, n));
  const step = Math.max(1, Math.floor(n / k));
  const centroids = [];
  for (let i = 0; i < k; i++) {
    centroids.push({ ...flatPixels[Math.min(i * step, n - 1)] });
  }

  let assignment = new Array(n).fill(0);
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = rgbDist(flatPixels[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      assignment[i] = best;
    }

    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < n; i++) {
      const c = assignment[i];
      sums[c].r += flatPixels[i].r;
      sums[c].g += flatPixels[i].g;
      sums[c].b += flatPixels[i].b;
      sums[c].count++;
    }
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c].count > 0) {
        centroids[c] = {
          r: Math.round(sums[c].r / sums[c].count),
          g: Math.round(sums[c].g / sums[c].count),
          b: Math.round(sums[c].b / sums[c].count),
        };
      }
    }
  }

  return { centroids, assignment };
}

// Folds any connected region smaller than minSize into whichever
// neighboring cluster borders it most — this is what removes the
// leftover single/double-stitch speckle after quantization.
function cleanupIslands(assignmentGrid, minSize) {
  const rows = assignmentGrid.length;
  const cols = assignmentGrid[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const result = assignmentGrid.map((r) => r.slice());

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited[r][c]) continue;
      const value = assignmentGrid[r][c];
      const stack = [[r, c]];
      const region = [];
      visited[r][c] = true;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        region.push([cr, cc]);
        const neighbors = [[cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && assignmentGrid[nr][nc] === value) {
            visited[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }

      if (region.length < minSize) {
        const votes = {};
        for (const [cr, cc] of region) {
          const neighbors = [[cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]];
          for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const v = assignmentGrid[nr][nc];
              if (v !== value) votes[v] = (votes[v] || 0) + 1;
            }
          }
        }
        let bestVal = null;
        let bestCount = 0;
        for (const [v, cnt] of Object.entries(votes)) {
          if (cnt > bestCount) {
            bestCount = cnt;
            bestVal = parseInt(v, 10);
          }
        }
        if (bestVal !== null) {
          for (const [cr, cc] of region) result[cr][cc] = bestVal;
        }
      }
    }
  }
  return result;
}

function nearestDMC(rgb) {
  let best = window.DMC_PALETTE[0];
  let bestDist = Infinity;
  for (const entry of window.DMC_PALETTE) {
    const d = rgbDist(rgb, hexToRgb(entry.hex));
    if (d < bestDist) {
      bestDist = d;
      best = entry;
    }
  }
  return best;
}

function convertPhotoToPattern(img, opts = {}) {
  const { cols = 70, rows = 70, colorCount = 12, minIslandSize = 3 } = opts;

  const pixelGrid = downsampleImageToGrid(img, cols, rows);
  const flat = [];
  for (const row of pixelGrid) for (const p of row) flat.push(p);

  const { centroids, assignment } = kMeansQuantize(flat, colorCount);

  let assignGrid = [];
  for (let r = 0; r < rows; r++) {
    assignGrid.push(assignment.slice(r * cols, (r + 1) * cols));
  }
  assignGrid = cleanupIslands(assignGrid, minIslandSize);
  assignGrid = cleanupIslands(assignGrid, minIslandSize);

  const usedClusters = new Set();
  for (const row of assignGrid) for (const v of row) usedClusters.add(v);

  const dmcCodeToIndex = {};
  const palette = {};
  const dmcLegend = {};
  const clusterToFinalIndex = {};
  let nextIndex = 1;
  for (const c of usedClusters) {
    const dmc = nearestDMC(centroids[c]);
    if (!(dmc.code in dmcCodeToIndex)) {
      dmcCodeToIndex[dmc.code] = nextIndex;
      palette[nextIndex] = dmc.hex;
      dmcLegend[nextIndex] = `DMC ${dmc.code} — ${dmc.name}`;
      nextIndex++;
    }
    clusterToFinalIndex[c] = dmcCodeToIndex[dmc.code];
  }

  const grid = assignGrid.map((row) => row.map((v) => clusterToFinalIndex[v]));

  return { grid, palette, dmcLegend, cols, rows };
}

window.PhotoConverter = { loadImageFile, convertPhotoToPattern };
