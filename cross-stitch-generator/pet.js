const petState = {
  img: null,
  purchased: false,
  lastGrid: null,
  lastTemplate: null,
};

function petSizeToGrid(size) {
  if (size === 'small') return 50;
  if (size === 'large') return 95;
  return 70;
}

function renderPetLegend(template, grid) {
  const wrap = document.getElementById('pet-legend');
  wrap.innerHTML = '';
  const counts = {};
  for (const row of grid) for (const idx of row) if (idx) counts[idx] = (counts[idx] || 0) + 1;

  const entries = Object.entries(template.dmcLegend).sort(
    (a, b) => (counts[b[0]] || 0) - (counts[a[0]] || 0)
  );
  for (const [idx, label] of entries) {
    const row = document.createElement('div');
    row.className = 'legend-row';
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = template.palette[idx];
    row.appendChild(swatch);
    const text = document.createElement('span');
    text.textContent = `${label} — ${counts[idx] || 0} stitches`;
    row.appendChild(text);
    wrap.appendChild(row);
  }
}

function redrawPetPreview() {
  if (!petState.lastGrid) return;
  const canvas = document.getElementById('pet-preview-canvas');
  const maxWidth = 560;
  const cellPx = Math.max(3, Math.min(9, Math.floor(maxWidth / petState.lastTemplate.cols)));
  renderGridToCanvas(canvas, petState.lastGrid, petState.lastTemplate, {
    cellPx,
    watermark: !petState.purchased,
  });
}

async function regeneratePetPattern() {
  if (!petState.img) return;
  const status = document.getElementById('pet-status');
  status.textContent = 'Processing your photo...';
  status.className = 'status';
  petState.purchased = false;
  updatePetUnlockUI();

  // let the status message paint before the synchronous k-means work
  await new Promise((resolve) => setTimeout(resolve, 20));

  const size = petSizeToGrid(document.getElementById('pet-size-select').value);
  const colorCount = parseInt(document.getElementById('pet-color-count').value, 10);
  document.getElementById('pet-color-count-label').textContent = colorCount;

  const result = PhotoConverter.convertPhotoToPattern(petState.img, {
    cols: size,
    rows: size,
    colorCount,
    minIslandSize: 3,
  });

  petState.lastGrid = result.grid;
  petState.lastTemplate = {
    id: 'custom',
    name: 'Custom Pet Portrait',
    cols: result.cols,
    rows: result.rows,
    palette: result.palette,
    dmcLegend: result.dmcLegend,
    fields: [],
  };

  redrawPetPreview();
  renderPetLegend(petState.lastTemplate, result.grid);
  status.textContent = '';
}

function updatePetUnlockUI() {
  const status = document.getElementById('pet-unlock-status');
  const fullBtn = document.getElementById('pet-download-full-btn');
  if (petState.purchased) {
    status.textContent = 'Unlocked — download your clean pattern below.';
    status.className = 'status ok';
    fullBtn.disabled = false;
  } else {
    status.textContent = '';
    status.className = 'status';
    fullBtn.disabled = true;
  }
}

function wirePetUpload() {
  document.getElementById('pet-photo-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById('pet-status');
    status.textContent = 'Loading photo...';
    try {
      petState.img = await PhotoConverter.loadImageFile(file);
    } catch (err) {
      status.textContent = 'Could not load that image — try a different file.';
      status.className = 'status error';
      return;
    }
    document.getElementById('pet-controls').style.display = 'flex';
    await regeneratePetPattern();
  });

  document.getElementById('pet-size-select').addEventListener('change', regeneratePetPattern);
  document.getElementById('pet-color-count').addEventListener('change', regeneratePetPattern);
  document.getElementById('pet-regenerate-btn').addEventListener('click', regeneratePetPattern);
}

function wirePetPurchase() {
  const buyLink = document.getElementById('pet-buy-link');
  buyLink.href = `https://gumroad.com/l/${window.APP_CONFIG.gumroadPetPermalink}`;
  document.getElementById('pet-price-label').textContent = window.APP_CONFIG.petPrice;

  const petFormLink = document.getElementById('pet-form-link');
  if (petFormLink) petFormLink.href = window.APP_CONFIG.customPetFormUrl;

  document.getElementById('pet-download-preview-btn').onclick = () => {
    if (!petState.lastGrid) return;
    exportPDF(petState.lastGrid, petState.lastTemplate, {}, {
      watermark: true,
      filenamePrefix: 'pet-portrait',
    });
  };

  document.getElementById('pet-download-full-btn').onclick = () => {
    if (!petState.lastGrid) return;
    exportPDF(petState.lastGrid, petState.lastTemplate, {}, {
      watermark: false,
      filenamePrefix: 'pet-portrait',
    });
  };

  document.getElementById('pet-unlock-btn').onclick = async () => {
    const key = document.getElementById('pet-license-key-input').value.trim();
    const status = document.getElementById('pet-unlock-status');
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
          product_id: window.APP_CONFIG.gumroadPetProductId,
          license_key: key,
        }),
      });
      const data = await res.json();
      if (data.success) {
        petState.purchased = true;
        redrawPetPreview();
        updatePetUnlockUI();
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

document.addEventListener('DOMContentLoaded', () => {
  wirePetUpload();
  wirePetPurchase();
  updatePetUnlockUI();
});
