// Builds a downloadable PDF: a title page with pattern info, the stitch
// chart, and a DMC-style color legend. Uses jsPDF (loaded via CDN).

function countColorUsage(grid) {
  const counts = {};
  for (const row of grid) {
    for (const idx of row) {
      if (!idx) continue;
      counts[idx] = (counts[idx] || 0) + 1;
    }
  }
  return counts;
}

async function exportPDF(grid, template, values, opts = {}) {
  const { watermark = false, filenamePrefix = 'cross-stitch-pattern' } = opts;
  const { jsPDF } = window.jspdf;

  const chartCanvas = document.createElement('canvas');
  renderGridToCanvas(chartCanvas, grid, template, { cellPx: 10, watermark });
  const chartDataUrl = chartCanvas.toDataURL('image/png');

  const doc = new jsPDF({
    orientation: chartCanvas.width > chartCanvas.height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // --- Page 1: cover / summary ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(template.name, pageW / 2, 60, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  let y = 90;
  for (const field of template.fields) {
    doc.text(`${field.label}: ${values[field.id] || ''}`, pageW / 2, y, { align: 'center' });
    y += 18;
  }

  doc.setFontSize(11);
  y += 10;
  doc.text(`Pattern size: ${template.cols} x ${template.rows} stitches`, pageW / 2, y, { align: 'center' });

  if (watermark) {
    doc.setTextColor(180, 30, 30);
    doc.setFontSize(13);
    y += 26;
    doc.text('This is a free watermarked preview. Buy the full pattern to unlock a clean, printable PDF.', pageW / 2, y, {
      align: 'center',
      maxWidth: pageW - 100,
    });
    doc.setTextColor(0, 0, 0);
  }

  // --- Page 2: color legend ---
  doc.addPage('a4', 'portrait');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Thread Color Legend', 40, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const counts = countColorUsage(grid);
  let ly = 80;
  for (const [idx, label] of Object.entries(template.dmcLegend)) {
    const hex = template.palette[idx];
    doc.setFillColor(hex);
    doc.rect(40, ly - 10, 16, 16, 'F');
    doc.setDrawColor(0);
    doc.rect(40, ly - 10, 16, 16);
    doc.text(`${label}  —  ${counts[idx] || 0} stitches`, 66, ly + 2);
    ly += 26;
  }

  // --- Page 3+: full chart ---
  doc.addPage(chartCanvas.width > chartCanvas.height ? 'a4' : 'a4', chartCanvas.width > chartCanvas.height ? 'landscape' : 'portrait');
  const cpW = doc.internal.pageSize.getWidth();
  const cpH = doc.internal.pageSize.getHeight();
  const margin = 30;
  const availW = cpW - margin * 2;
  const availH = cpH - margin * 2;
  const scale = Math.min(availW / chartCanvas.width, availH / chartCanvas.height);
  const drawW = chartCanvas.width * scale;
  const drawH = chartCanvas.height * scale;
  doc.addImage(chartDataUrl, 'PNG', (cpW - drawW) / 2, (cpH - drawH) / 2, drawW, drawH);

  const suffix = watermark ? 'PREVIEW' : 'FULL';
  doc.save(`${filenamePrefix}-${template.id}-${suffix}.pdf`);
}

window.exportPDF = exportPDF;
