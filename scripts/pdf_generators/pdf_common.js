/**
 * Common PDF Generation Framework for FarmsKing Punjabi A4 Architectural Dossiers
 * Strictly adheres to FarmsKing Rules:
 *  - Rule 0: Strict Technical Verification & Truth
 *  - Rule 3: Corporate Registration (CIN: U01100PB2026PTC063294, Goindwal Sahib, Punjab)
 *  - Rule 4: Mandatory A4 Page Setup (210mm x 297mm)
 *  - High Quality Punjabi Gurmukhi Typography with Professional English Subtitles
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const DESKTOP_DIR = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd';
const ROOT_DIR = 'D:\\farmsking';

const COMMON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Mukta+Mahee:wght@400;500;600;700;800&family=Noto+Sans+Gurmukhi:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap');

  @page {
    size: A4 portrait;
    margin: 12mm 14mm 12mm 14mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: 'Mukta Mahee', 'Noto Sans Gurmukhi', 'Raavi', 'Nirmala UI', 'Segoe UI', sans-serif;
    color: #0f172a;
    font-size: 8.8pt;
    line-height: 1.44;
  }

  /* Precision A4 Page Container (297mm - 24mm margin = 273mm max height) */
  .page {
    width: 100%;
    height: 271mm;
    max-height: 271mm;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    position: relative;
  }

  /* Header */
  .doc-header {
    border-bottom: 2px solid #059669;
    padding-bottom: 7px;
    margin-bottom: 9px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .brand-group h1 {
    margin: 0;
    font-size: 13pt;
    font-weight: 800;
    color: #044e27;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .brand-group .sub {
    font-size: 7.6pt;
    color: #475569;
    font-weight: 600;
    margin-top: 2px;
  }

  .header-meta {
    text-align: right;
    font-size: 7.4pt;
    color: #334155;
    line-height: 1.35;
  }

  .header-meta .tag {
    display: inline-block;
    background: #ecfdf5;
    color: #047857;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    border: 1px solid #a7f3d0;
    margin-bottom: 2px;
  }

  /* Content area */
  .page-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* Footer */
  .doc-footer {
    border-top: 1px solid #cbd5e1;
    padding-top: 6px;
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.2pt;
    color: #64748b;
  }

  .doc-footer .statutory {
    font-weight: 600;
    color: #334155;
  }

  /* Typography */
  h2.sec-title {
    font-size: 10.2pt;
    font-weight: 800;
    color: #064e3b;
    margin: 0 0 6px 0;
    padding: 3px 8px;
    background: #f0fdf4;
    border-left: 3.5px solid #059669;
    border-radius: 0 4px 4px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h3.sub-title {
    font-size: 9.1pt;
    font-weight: 700;
    color: #0f172a;
    margin: 6px 0 4px 0;
  }

  p {
    margin: 0 0 6px 0;
    text-align: justify;
  }

  /* Tables */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 7px;
    font-size: 8pt;
  }

  table.data-table th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 4.5px 7px;
    border: 1px solid #1e293b;
  }

  table.data-table td {
    padding: 4px 7px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }

  table.data-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  /* Cards & Grids */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
    margin-bottom: 7px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 7px;
    margin-bottom: 7px;
  }

  .info-box {
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 6px 8px;
    background: #ffffff;
    margin-bottom: 6px;
  }

  .info-box.highlight {
    border-color: #6ee7b7;
    background: #f0fdf4;
  }

  .info-box.blue {
    border-color: #93c5fd;
    background: #eff6ff;
  }

  .info-box.amber {
    border-color: #fde68a;
    background: #fffbeb;
  }

  .info-box.purple {
    border-color: #d8b4fe;
    background: #faf5ff;
  }

  .info-box h4 {
    margin: 0 0 3px 0;
    font-size: 8.6pt;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-box p {
    margin: 0;
    font-size: 7.9pt;
    line-height: 1.38;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
  .badge-amber { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
  .badge-purple { background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe; }
  .badge-dark { background: #334155; color: #ffffff; }

  /* Feature evaluation boxes at document end */
  .eval-container {
    margin-top: auto;
    border-top: 1.5px solid #059669;
    padding-top: 7px;
  }

  .eval-box-top {
    background: #ecfdf5;
    border: 1.2px solid #059669;
    border-radius: 5px;
    padding: 6px 9px;
    margin-bottom: 6px;
  }

  .eval-box-future {
    background: #eff6ff;
    border: 1.2px solid #2563eb;
    border-radius: 5px;
    padding: 6px 9px;
  }

  .eval-box-top h4 {
    margin: 0 0 3px 0;
    color: #065f46;
    font-size: 8.6pt;
    font-weight: 800;
  }

  .eval-box-future h4 {
    margin: 0 0 3px 0;
    color: #1e40af;
    font-size: 8.6pt;
    font-weight: 800;
  }

  .eval-list {
    margin: 0;
    padding-left: 15px;
    font-size: 7.8pt;
    line-height: 1.35;
  }

  .eval-list li {
    margin-bottom: 2.5px;
  }

  /* Statutory Sign-off Box */
  .statutory-signoff {
    border: 1.2px solid #059669;
    background: #f0fdf4;
    border-radius: 5px;
    padding: 6px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
  }

  .statutory-signoff .title {
    font-weight: 800;
    font-size: 8.5pt;
    color: #064e3b;
    text-transform: uppercase;
  }

  .statutory-signoff .details {
    font-size: 7.2pt;
    color: #475569;
  }
`;

function createPage(pageNumber, totalPages, docTitle, docSub, bodyHtml) {
  return `
    <div class="page">
      <div class="doc-header">
        <div class="brand-group">
          <h1>ਫਾਰਮਸਕਿੰਗ ਤਕਨਾਲੋਜੀ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ</h1>
          <div class="sub">FARMSKING TECHNOLOGIES PRIVATE LIMITED &bull; CIN: U01100PB2026PTC063294</div>
        </div>
        <div class="header-meta">
          <div class="tag">${docTitle}</div>
          <div>${docSub}</div>
          <div style="color: #059669; font-weight: 700;">ISO 9001:2015 &bull; ISO 27001:2022</div>
        </div>
      </div>

      <div class="page-body">
        ${bodyHtml}
      </div>

      <div class="doc-footer">
        <div class="statutory">ਸੰਵਿਧਾਨਕ ਤੇ ਗੁਪਤ &bull; ਰਜਿਸਟਰਡ ਦਫ਼ਤਰ: ਵੀ.ਪੀ.ਓ. ਗੋਇੰਦਵਾਲ ਸਾਹਿਬ, ਤਹਿਸੀਲ ਖਡੂਰ ਸਾਹਿਬ, ਤਰਨ ਤਾਰਨ (ਪੰਜਾਬ) - 143422</div>
        <div>ਸਫ਼ਾ ${pageNumber} / ${totalPages}</div>
      </div>
    </div>
  `;
}

function renderA4Pdf(filename, docTitle, pages) {
  const totalPages = pages.length;
  const pagesHtml = pages.map((p, idx) => createPage(idx + 1, totalPages, docTitle, p.sub, p.html)).join('\n');

  const fullHtml = `<!DOCTYPE html>
  <html lang="pa">
  <head>
    <meta charset="utf-8">
    <title>${docTitle} - FarmsKing Architecture Dossier</title>
    <style>
      ${COMMON_CSS}
    </style>
  </head>
  <body>
    ${pagesHtml}
  </body>
  </html>`;

  const tempHtmlPath = path.join(__dirname, `_temp_${path.parse(filename).name}.html`);
  const destPdfPath = path.join(ROOT_DIR, filename);
  const desktopPdfPath = path.join(DESKTOP_DIR, filename);

  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  try {
    const cmd = `${CHROME_PATH} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${destPdfPath}" "${tempHtmlPath}"`;
    execSync(cmd, { stdio: 'ignore' });

    if (fs.existsSync(destPdfPath)) {
      const stats = fs.statSync(destPdfPath);
      const sizeKb = (stats.size / 1024).toFixed(1);
      console.log(`[OK] Generated: ${filename} (${sizeKb} KB, ${totalPages} pages)`);

      // Sync to desktop folder
      if (fs.existsSync(DESKTOP_DIR)) {
        fs.copyFileSync(destPdfPath, desktopPdfPath);
        console.log(`[OK] Synced to Desktop: ${desktopPdfPath}`);
      }
      return { success: true, path: destPdfPath, sizeKb };
    }
    throw new Error('Destination PDF file not found after Chrome execution.');
  } catch (err) {
    console.error(`[FAIL] Error rendering ${filename}:`, err.message);
    throw err;
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }
}

module.exports = {
  renderA4Pdf,
  COMMON_CSS,
  DESKTOP_DIR,
  ROOT_DIR,
};
