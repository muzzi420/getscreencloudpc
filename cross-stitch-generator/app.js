const state = {
  templateId: 'wedding-classic',
  values: {},
  purchased: false,
};

let renderTimer = null;

function initValuesForTemplate(tpl) {
  for (const f of tpl.fields) {
    if (state.values[f.id] === undefined) {
      state.values[f.id] = f.default;
    }
  }
}

function currentTemplate() {
  return getTemplate(state.templateId);
}

function renderCategoryTabs() {
  const categories = [...new Set(TEMPLATES.map((t) => t.category))];
  const wrap = document.getElementById('category-tabs');
  wrap.innerHTML = '';
  const activeCategory = currentTemplate().category;
  for (const cat of categories) {
    const btn = document.createElement('button');
    btn.className = 'tab' + (cat === activeCategory ? ' active' : '');
    btn.textContent = cat === 'wedding' ? 'Wedding' : 'Baby Announcement';
    btn.onclick = () => {
      const first = TEMPLATES.find((t) => t.category === cat);
      state.templateId = first.id;
      state.purchased = false;
      initValuesForTemplate(first);
      renderAll();
    };
    wrap.appendChild(btn);
  }
}

function renderTemplateCards() {
  const wrap = document.getElementById('template-cards');
  wrap.innerHTML = '';
  const cat = currentTemplate().category;
  const options = TEMPLATES.filter((t) => t.category === cat);
  for (const t of options) {
    const card = document.createElement('button');
    card.className = 'card' + (t.id === state.templateId ? ' active' : '');
    card.textContent = t.name;
    card.onclick = () => {
      state.templateId = t.id;
      state.purchased = false;
      initValuesForTemplate(t);
      renderAll();
    };
    wrap.appendChild(card);
  }
}

function renderForm() {
  const tpl = currentTemplate();
  const wrap = document.getElementById('form-fields');
  wrap.innerHTML = '';
  for (const f of tpl.fields) {
    const label = document.createElement('label');
    label.textContent = f.label;
    const input = document.createElement('input');
    input.type = 'text';
    if (f.maxLength) input.maxLength = f.maxLength;
    input.value = state.values[f.id] ?? f.default;
    input.oninput = (e) => {
      state.values[f.id] = e.target.value;
      state.purchased = false;
      scheduleRenderPreview();
      updateUnlockUI();
    };
    label.appendChild(input);
    wrap.appendChild(label);
  }
}

function scheduleRenderPreview() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderPreview, 150);
}

function renderPreview() {
  const tpl = currentTemplate();
  const grid = buildGrid(tpl.id, state.values);
  state.lastGrid = grid;

  const canvas = document.getElementById('preview-canvas');
  const maxWidth = 640;
  const cellPx = Math.max(4, Math.min(10, Math.floor(maxWidth / tpl.cols)));
  renderGridToCanvas(canvas, grid, tpl, { cellPx, watermark: !state.purchased });

  renderLegend(tpl, grid);
}

function renderLegend(tpl, grid) {
  const wrap = document.getElementById('legend');
  wrap.innerHTML = '';
  const counts = {};
  for (const row of grid) for (const idx of row) if (idx) counts[idx] = (counts[idx] || 0) + 1;

  for (const [idx, label] of Object.entries(tpl.dmcLegend)) {
    const row = document.createElement('div');
    row.className = 'legend-row';
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = tpl.palette[idx];
    row.appendChild(swatch);
    const text = document.createElement('span');
    text.textContent = `${label} — ${counts[idx] || 0} stitches`;
    row.appendChild(text);
    wrap.appendChild(row);
  }
}

function updateUnlockUI() {
  const status = document.getElementById('unlock-status');
  const fullBtn = document.getElementById('download-full-btn');
  if (state.purchased) {
    status.textContent = 'Unlocked — download your clean pattern below.';
    status.className = 'status ok';
    fullBtn.disabled = false;
  } else {
    status.textContent = '';
    status.className = 'status';
    fullBtn.disabled = true;
  }
}

function wireButtons() {
  const buyLink = document.getElementById('buy-link');
  buyLink.href = `https://gumroad.com/l/${window.APP_CONFIG.gumroadPermalink}`;
  document.getElementById('price-label').textContent = window.APP_CONFIG.price;

  const petFormLink = document.getElementById('pet-form-link');
  if (petFormLink) petFormLink.href = window.APP_CONFIG.customPetFormUrl;

  document.getElementById('download-preview-btn').onclick = () => {
    const tpl = currentTemplate();
    exportPDF(state.lastGrid, tpl, state.values, { watermark: true });
  };

  document.getElementById('download-full-btn').onclick = () => {
    const tpl = currentTemplate();
    exportPDF(state.lastGrid, tpl, state.values, { watermark: false });
  };

  document.getElementById('unlock-btn').onclick = async () => {
    const key = document.getElementById('license-key-input').value.trim();
    const status = document.getElementById('unlock-status');
    if (!key) {
      status.textContent = 'Enter the license key from your purchase receipt email.';
      status.className = 'status error';
      return;
    }
    status.textContent = 'Checking...';
    status.className = 'status';
    try {
      const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          product_id: window.APP_CONFIG.gumroadProductId,
          license_key: key,
        }),
      });
      const data = await res.json();
      if (data.success) {
        state.purchased = true;
        renderPreview();
        updateUnlockUI();
      } else {
        status.textContent = 'That license key was not recognized. Check your receipt email.';
        status.className = 'status error';
      }
    } catch (err) {
      status.textContent = 'Could not verify right now — check your connection and try again.';
      status.className = 'status error';
    }
  };
}

function renderAll() {
  renderCategoryTabs();
  renderTemplateCards();
  renderForm();
  renderPreview();
  updateUnlockUI();
}

document.addEventListener('DOMContentLoaded', async () => {
  initValuesForTemplate(currentTemplate());
  wireButtons();
  // Force the bundled stitch font to actually load before the first render —
  // otherwise the canvas silently falls back to a generic font for one frame
  // (or permanently, on some browsers) and the chart doesn't match what
  // customers see once the font finishes loading.
  try {
    await document.fonts.load("400 40px 'StitchBlock'");
    await document.fonts.ready;
  } catch (e) {
    // font API unsupported / failed to load — fall back to system fonts
  }
  renderAll();
});
