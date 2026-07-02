// Template definitions: grid size, color palette, DMC-style legend,
// decorative motif placement, and personalizable text zones.
// Motif shapes come from motifs.js (parametric, not hand-drawn bitmaps).
// Text zones are filled at render time via textRaster.js.

const TEMPLATES = [
  {
    id: 'wedding-classic',
    category: 'wedding',
    name: 'Classic Wedding Sampler',
    cols: 70,
    rows: 92,
    palette: { 1: '#2b2b2b', 2: '#c5748f', 3: '#8aa17c' },
    dmcLegend: {
      1: 'DMC 310 — Black (outline)',
      2: 'DMC 3722 — Dusty Rose',
      3: 'DMC 3053 — Sage Green',
    },
    border: { margin: 4, spacing: 6, colorIndex: 3 },
    motifs: [
      { type: 'flower', row: 8, col: 8, w: 11, h: 11, colorIndex: 2 },
      { type: 'flower', row: 8, col: 51, w: 11, h: 11, colorIndex: 2 },
      { type: 'flower', row: 73, col: 8, w: 11, h: 11, colorIndex: 2 },
      { type: 'flower', row: 73, col: 51, w: 11, h: 11, colorIndex: 2 },
      { type: 'doubleRing', row: 14, col: 18, w: 34, h: 16, colorIndex: 1 },
      { type: 'heart', row: 68, col: 30, w: 10, h: 9, colorIndex: 2 },
    ],
    fields: [
      { id: 'name1', label: 'Partner 1 name', default: 'Emma', maxLength: 18 },
      { id: 'name2', label: 'Partner 2 name', default: 'Liam', maxLength: 18 },
      { id: 'date', label: 'Wedding date', default: 'June 14, 2026', maxLength: 16 },
    ],
    textZones: [
      {
        row: 36,
        col: 6,
        w: 58,
        h: 14,
        colorIndex: 1,
        font: { family: "'Brush Script MT', 'Segoe Script', cursive", style: 'italic', weight: 'normal' },
        text: (v) => `${v.name1} & ${v.name2}`,
      },
      {
        row: 54,
        col: 10,
        w: 50,
        h: 8,
        colorIndex: 1,
        font: { family: 'Georgia, serif', style: 'normal', weight: 'bold' },
        text: (v) => v.date,
      },
    ],
  },
  {
    id: 'wedding-modern',
    category: 'wedding',
    name: 'Modern Minimal Wedding',
    cols: 70,
    rows: 92,
    palette: { 1: '#222222', 2: '#b08d57', 3: '#6f8faa' },
    dmcLegend: {
      1: 'DMC 310 — Black (outline)',
      2: 'DMC 3852 — Gold',
      3: 'DMC 931 — Dusty Blue',
    },
    border: { margin: 4, spacing: 8, colorIndex: 2 },
    motifs: [
      { type: 'heart', row: 8, col: 27, w: 16, h: 14, colorIndex: 3 },
      { type: 'ring', row: 68, col: 26, w: 18, h: 18, colorIndex: 2 },
    ],
    fields: [
      { id: 'name1', label: 'Partner 1 name', default: 'Ava', maxLength: 18 },
      { id: 'name2', label: 'Partner 2 name', default: 'Noah', maxLength: 18 },
      { id: 'date', label: 'Wedding date', default: '09.20.2026', maxLength: 16 },
    ],
    textZones: [
      {
        row: 32,
        col: 6,
        w: 58,
        h: 14,
        colorIndex: 1,
        font: { family: 'Georgia, serif', style: 'normal', weight: 'bold' },
        text: (v) => `${v.name1} & ${v.name2}`,
      },
      {
        row: 50,
        col: 12,
        w: 46,
        h: 8,
        colorIndex: 1,
        font: { family: 'Helvetica, Arial, sans-serif', style: 'normal', weight: 'normal' },
        text: (v) => v.date,
      },
    ],
  },
  {
    id: 'baby-classic',
    category: 'baby',
    name: 'Classic Baby Announcement',
    cols: 64,
    rows: 84,
    palette: { 1: '#2b2b2b', 2: '#e39fb0', 3: '#f2d18c' },
    dmcLegend: {
      1: 'DMC 310 — Black (outline)',
      2: 'DMC 3689 — Pink',
      3: 'DMC 3855 — Honey Gold',
    },
    border: { margin: 4, spacing: 6, colorIndex: 3 },
    motifs: [
      { type: 'star', row: 6, col: 6, w: 8, h: 8, colorIndex: 2 },
      { type: 'star', row: 6, col: 50, w: 8, h: 8, colorIndex: 2 },
      { type: 'star', row: 70, col: 6, w: 8, h: 8, colorIndex: 2 },
      { type: 'star', row: 70, col: 50, w: 8, h: 8, colorIndex: 2 },
      { type: 'flower', row: 9, col: 22, w: 20, h: 18, colorIndex: 2 },
    ],
    fields: [
      { id: 'babyName', label: 'Baby name', default: 'Ava', maxLength: 18 },
      { id: 'date', label: 'Birth date', default: 'March 3, 2026', maxLength: 16 },
    ],
    textZones: [
      {
        row: 34,
        col: 4,
        w: 56,
        h: 16,
        colorIndex: 1,
        font: { family: "'Brush Script MT', 'Segoe Script', cursive", style: 'italic', weight: 'bold' },
        text: (v) => v.babyName,
      },
      {
        row: 56,
        col: 8,
        w: 48,
        h: 10,
        colorIndex: 1,
        font: { family: 'Georgia, serif', style: 'normal', weight: 'normal' },
        text: (v) => v.date,
      },
    ],
  },
  {
    id: 'baby-modern',
    category: 'baby',
    name: 'Modern Baby Announcement',
    cols: 64,
    rows: 84,
    palette: { 1: '#2b2b2b', 2: '#7ec9b0', 3: '#4a5a8a' },
    dmcLegend: {
      1: 'DMC 310 — Black (outline)',
      2: 'DMC 992 — Mint Green',
      3: 'DMC 823 — Navy Blue',
    },
    border: { margin: 4, spacing: 8, colorIndex: 3 },
    motifs: [
      { type: 'star', row: 8, col: 23, w: 18, h: 17, colorIndex: 2 },
    ],
    fields: [
      { id: 'babyName', label: 'Baby name', default: 'Noah', maxLength: 18 },
      { id: 'date', label: 'Birth date', default: '03.03.2026', maxLength: 16 },
    ],
    textZones: [
      {
        row: 34,
        col: 4,
        w: 56,
        h: 16,
        colorIndex: 1,
        font: { family: 'Helvetica, Arial, sans-serif', style: 'normal', weight: 'bold' },
        text: (v) => v.babyName,
      },
      {
        row: 55,
        col: 10,
        w: 44,
        h: 10,
        colorIndex: 1,
        font: { family: 'Helvetica, Arial, sans-serif', style: 'normal', weight: 'normal' },
        text: (v) => v.date,
      },
    ],
  },
];

function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id);
}

function buildGrid(templateId, values) {
  const tpl = getTemplate(templateId);
  if (!tpl) throw new Error(`Unknown template: ${templateId}`);
  const grid = Motifs.makeGrid(tpl.cols, tpl.rows);

  if (tpl.border) {
    Motifs.drawBorder(grid, tpl.border.margin, tpl.border.spacing, tpl.border.colorIndex);
  }

  for (const m of tpl.motifs || []) {
    let shape;
    switch (m.type) {
      case 'heart':
        shape = Motifs.generateHeart(m.w, m.h);
        break;
      case 'ring':
        shape = Motifs.generateRing(m.w, m.h);
        break;
      case 'doubleRing':
        shape = Motifs.generateDoubleRing(m.w, m.h);
        break;
      case 'flower':
        shape = Motifs.generateFlower(m.w, m.h);
        break;
      case 'star':
        shape = Motifs.generateStar(m.w, m.h);
        break;
      default:
        continue;
    }
    Motifs.stamp(grid, shape, m.row, m.col, m.colorIndex);
  }

  for (const zone of tpl.textZones || []) {
    const text = zone.text(values);
    const raster = rasterizeText(text, zone.w, zone.h, {
      fontFamily: zone.font.family,
      fontStyle: zone.font.style,
      fontWeight: zone.font.weight,
    });
    for (let r = 0; r < zone.h; r++) {
      for (let c = 0; c < zone.w; c++) {
        if (raster[r][c]) {
          const tr = zone.row + r;
          const tc = zone.col + c;
          if (tr >= 0 && tr < tpl.rows && tc >= 0 && tc < tpl.cols) {
            grid[tr][tc] = zone.colorIndex;
          }
        }
      }
    }
  }

  return grid;
}

window.TEMPLATES = TEMPLATES;
window.getTemplate = getTemplate;
window.buildGrid = buildGrid;
